/**
 * GET /api/stats  → Statistik aggregate per group & keseluruhan
 * Dipakai oleh KPIHeader dan analytics page
 */
import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';
import { computeStatus, formatLocalDate } from '$lib/server/statusHelper.js';

export async function GET() {
    try {
        // Ambil semua tangki untuk hitung status (karena status berbasis tanggal hari ini)
        const rows = await query('SELECT * FROM tanks');

        const stats = {
            total:      0,
            aman:       0,
            notice:     0,
            jatuh_tempo: 0,
            non_aktif:  0,
            groups:     {}
        };

        for (const row of rows) {
            const rec = computeStatus({
                id:               row.id,
                group:            row.group_name,
                status_mc:        row.status_mc,
                next_maintenance: formatLocalDate(row.next_maintenance)
            });

            stats.total++;

            if (rec.computed_status === 'AMAN')       stats.aman++;
            if (rec.computed_status === 'NOTICE')      stats.notice++;
            if (rec.computed_status === 'JATUH TEMPO') stats.jatuh_tempo++;
            if (rec.computed_status === 'NON-AKTIF')   stats.non_aktif++;

            const g = row.group_name || 'Lainnya';
            if (!stats.groups[g]) {
                stats.groups[g] = { total: 0, noticeCount: 0 };
            }
            stats.groups[g].total++;
            if (rec.computed_status === 'NOTICE' || rec.computed_status === 'JATUH TEMPO') {
                stats.groups[g].noticeCount++;
            }
        }

        return json(stats);
    } catch (err) {
        console.error('[API /stats GET]', err);
        return json({ error: 'Gagal mengambil statistik', detail: err.message }, { status: 500 });
    }
}
