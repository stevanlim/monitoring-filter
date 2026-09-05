/**
 * GET  /api/records         → Ambil semua tangki/unit (dengan pagination & filter opsional)
 * POST /api/records         → Tambah unit pemasangan filter baru
 */
import { json } from '@sveltejs/kit';
import { query, insert } from '$lib/server/db.js';
import { transformTank, formatLocalDate, getTodayLocal, calculateNextMaintenanceDate } from '$lib/server/statusHelper.js';

// Auto-migrate format lama ke nama unit standar
async function autoMigrateUnitNames() {
    try {
        await query(`
            UPDATE tanks 
            SET tank_capacity = 'Tangki Timbun Solar' 
            WHERE tank_capacity LIKE '%ltr%' 
               OR tank_capacity LIKE '%Ltr%' 
               OR tank_capacity LIKE '%LTR%'
               OR tank_capacity = '-' 
               OR tank_capacity = ''
               OR tank_capacity IS NULL
        `);
    } catch (e) {
        // Abaikan jika DB belum siap
    }
}

export async function GET({ url }) {
    try {
        await autoMigrateUnitNames();

        const groupFilter  = url.searchParams.get('group');
        const statusFilter = url.searchParams.get('status');
        const search       = url.searchParams.get('search');

        let sql = `SELECT * FROM tanks WHERE 1=1`;
        const params = [];

        if (groupFilter && groupFilter !== 'ALL') {
            sql += ` AND group_name = ?`;
            params.push(groupFilter);
        }
        if (search) {
            sql += ` AND (estate LIKE ? OR location_type LIKE ? OR region LIKE ? OR pic_manager LIKE ? OR phone_number LIKE ? OR equipment LIKE ? OR tank_capacity LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s, s, s, s);
        }

        sql += ` ORDER BY group_name, estate`;

        const rows = await query(sql, params);
        let records = rows.map(r => transformTank(r));

        // Filter status setelah compute (karena status dihitung dari tanggal hari ini)
        if (statusFilter && statusFilter !== 'ALL') {
            records = records.filter(r => r.computed_status === statusFilter);
        }

        return json(records);
    } catch (err) {
        console.error('[API /records GET]', err);
        return json({ error: 'Gagal mengambil data unit dari database', detail: err.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();

        const installDateStr = formatLocalDate(body.install_date) || getTodayLocal();
        const lastDateStr = formatLocalDate(body.last_maintenance) || installDateStr;
        const intervalMonths = parseInt(body.interval_days || body.interval_months) || 90;

        // Hitung target next_maintenance secara aman & presisi
        const nextDateStr = calculateNextMaintenanceDate(lastDateStr, intervalMonths);

        // Nama / Tipe Unit yang diketik user
        const unitName = (body.unit_name || body.tank_capacity || 'Tangki Timbun Solar').trim();

        // 1. Insert ke tabel tanks
        const insertId = await insert('tanks', {
            group_name:       body.group          || 'CBI Group',
            sheet_name:       body.sheet          || 'Manual Input',
            region:           body.region         || 'Umum',
            estate:           body.estate         || '',
            location_type:    body.location_type  || 'Kebun',
            tank_capacity:    unitName,
            sisa_solar:       body.sisa_solar     || '-',
            equipment:        body.equipment      || 'MicroClean Filter MDF250 / FEC250',
            status_mc:        'AKTIF',
            install_date:     installDateStr,
            last_maintenance: lastDateStr,
            next_maintenance: nextDateStr,
            interval_months:  intervalMonths,
            pic_manager:      body.pic_manager     || '',
            pic_gudang:       body.pic_gudang      || '',
            phone_number:     body.phone_number    || '',
            notes:            body.notes           || `Pemasangan baru filter MicroClean pada unit ${unitName}`
        });

        // 2. Insert event pemasangan awal ke maintenance_history
        const initialMaintId = await insert('maintenance_history', {
            tank_id:          insertId,
            service_date:     installDateStr,
            interval_months:  intervalMonths,
            notes:            body.notes || `Pemasangan Awal Filter pada unit ${unitName}`,
            technician:       body.pic_manager || 'Teknisi Lapangan'
        });

        // Ambil record lengkap yang baru dibuat
        const rows = await query('SELECT * FROM tanks WHERE id = ?', [insertId]);
        const newRecord = transformTank(rows[0]);
        newRecord.maintenance_id = initialMaintId;

        return json(newRecord, { status: 201 });
    } catch (err) {
        console.error('[API /records POST]', err);
        return json({ error: 'Gagal menambah unit baru', detail: err.message }, { status: 500 });
    }
}
