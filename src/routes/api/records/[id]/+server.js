/**
 * GET    /api/records/[id]   → Ambil detail lengkap 1 tangki + kronologi timeline maintenance + foto-foto
 * PATCH  /api/records/[id]   → Update servis (last_maintenance, next_maintenance, insert maintenance_history)
 * DELETE /api/records/[id]   → Hapus unit tangki beserta seluruh riwayatnya
 */
import { json } from '@sveltejs/kit';
import { query, insert } from '$lib/server/db.js';
import { transformTank, formatLocalDate, addMonthsToDate } from '$lib/server/statusHelper.js';
import { getValidPhotos } from '$lib/server/photoHelper.js';

export async function GET({ params }) {
    try {
        const { id } = params;

        const tanks = await query('SELECT * FROM tanks WHERE id = ?', [id]);
        if (!tanks.length) {
            return json({ error: 'Tangki tidak ditemukan' }, { status: 404 });
        }

        const tank = transformTank(tanks[0]);

        // 1. Ambil seluruh riwayat maintenance terurut dari pemasangan awal ke servis terbaru
        const historyRows = await query(
            'SELECT * FROM maintenance_history WHERE tank_id = ? ORDER BY service_date ASC, id ASC',
            [id]
        );

        // 2. Ambil seluruh foto valid untuk tangki ini
        const allPhotos = await getValidPhotos({
            group: tank.group,
            region: tank.region,
            estate: tank.estate
        });

        // Filter foto yang sesuai dengan tangki ini (by tank_id atau estate)
        const tankPhotos = allPhotos.filter(p => 
            (p.tank_id && String(p.tank_id) === String(id)) ||
            (p.estate && tank.estate && p.estate.toLowerCase() === tank.estate.toLowerCase())
        );

        // Map maintenance history dengan penomoran servis (Servis #1, Servis #2, dst.)
        const historyTimeline = historyRows.map((h, idx) => {
            const dateStr = formatLocalDate(h.service_date);

            // Cari foto yang terkait langsung via maintenance_id
            let matchedPhotos = tankPhotos.filter(p => 
                p.maintenance_id && String(p.maintenance_id) === String(h.id)
            );

            // Fallback untuk data lama yang belum punya maintenance_id
            if (matchedPhotos.length === 0) {
                matchedPhotos = tankPhotos.filter(p => 
                    !p.maintenance_id && (p.date === dateStr || (p.caption && p.caption.includes(dateStr)))
                );
            }

            // Hanya baris pertama (idx 0) yang merupakan pemasangan awal
            const isInitial = idx === 0;

            return {
                id: h.id,
                service_number: isInitial ? 0 : idx,
                title: isInitial ? 'Pemasangan Awal Unit Filter' : `Pergantian Filter (Servis #${idx})`,
                is_initial: isInitial,
                service_date: dateStr,
                interval_months: h.interval_months || 3,
                notes: h.notes || (isInitial ? 'Pemasangan awal filter unit baru' : 'Pergantian elemen filter MicroClean'),
                technician: h.technician || 'Teknisi Lapangan',
                photos: matchedPhotos
            };
        });

        // Jika riwayat kosong tetapi install_date ada, buat item initial install
        if (historyTimeline.length === 0 && tank.install_date) {
            const installDateStr = tank.install_date;
            const matchedPhotos = tankPhotos.filter(p => p.date === installDateStr || !p.maintenance_id);

            historyTimeline.push({
                id: 'INITIAL',
                service_number: 0,
                title: 'Pemasangan Awal Unit Filter',
                is_initial: true,
                service_date: installDateStr,
                interval_months: tank.interval_months || 3,
                notes: tank.notes || 'Pemasangan awal filter unit baru',
                technician: tank.pic_manager || 'Teknisi Lapangan',
                photos: matchedPhotos
            });
        }

        tank.maintenance_count = Math.max(0, historyTimeline.length - 1); // Exclude initial install from replacement count
        tank.maintenance_history = historyTimeline;
        tank.all_photos = tankPhotos;

        return json(tank);
    } catch (err) {
        console.error('[API /records/[id] GET]', err);
        return json({ error: 'Gagal mengambil detail tangki', detail: err.message }, { status: 500 });
    }
}

export async function PATCH({ params, request }) {
    try {
        const { id } = params;
        const body = await request.json();

        const {
            service_date,
            interval_months = 3,
            notes = '',
            technician = 'Teknisi Lapangan',
            status_mc = null,
            equipment = null,
            photo_id = null
        } = body;

        // Jika hanya update status (misal menonaktifkan unit)
        if (status_mc && !service_date) {
            await query('UPDATE tanks SET status_mc = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status_mc, id]);
            const updatedRows = await query('SELECT * FROM tanks WHERE id = ?', [id]);
            return json({ success: true, record: transformTank(updatedRows[0]) });
        }

        if (!service_date) {
            return json({ error: 'service_date wajib diisi' }, { status: 400 });
        }

        const svcDateStr = formatLocalDate(service_date);
        const nextDateStr = addMonthsToDate(svcDateStr, parseInt(interval_months));

        // 1. Update tabel tanks (termasuk tipe filter / equipment baru jika ada perubahan)
        await query(
            `UPDATE tanks
             SET equipment        = COALESCE(?, equipment),
                 last_maintenance = ?,
                 next_maintenance = ?,
                 interval_months  = ?,
                 status_mc        = 'AKTIF',
                 updated_at       = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [equipment || null, svcDateStr, nextDateStr, parseInt(interval_months), id]
        );

        // 2. Insert ke maintenance_history
        const maintId = await insert('maintenance_history', {
            tank_id:          parseInt(id),
            service_date:     svcDateStr,
            interval_months:  parseInt(interval_months),
            notes:            notes || '',
            technician:       technician
        });

        // 3. Jika ada photo_id yang di-upload pada servis ini, tautkan maintenance_id
        if (photo_id) {
            await query('UPDATE photos SET maintenance_id = ? WHERE id = ?', [maintId, photo_id]);
        }

        // Return record yang sudah di-update
        const updatedRows = await query('SELECT * FROM tanks WHERE id = ?', [id]);
        const updated = transformTank(updatedRows[0]);

        return json({ success: true, record: updated, maintenance_id: maintId });
    } catch (err) {
        console.error('[API /records/[id] PATCH]', err);
        return json({ error: 'Gagal update data servis', detail: err.message }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const { id } = params;

        // Ambil info tangki dulu
        const tanks = await query('SELECT * FROM tanks WHERE id = ?', [id]);
        if (!tanks.length) {
            return json({ error: 'Tangki tidak ditemukan' }, { status: 404 });
        }

        // Hapus tangki dari database (Foreign keys maintenance_history dan photos otomatis ON DELETE CASCADE)
        await query('DELETE FROM tanks WHERE id = ?', [id]);

        return json({ success: true, message: `Unit tangki #${id} berhasil dihapus` });
    } catch (err) {
        console.error('[API /records/[id] DELETE]', err);
        return json({ error: 'Gagal menghapus unit tangki', detail: err.message }, { status: 500 });
    }
}
