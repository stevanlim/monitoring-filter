/**
 * src/routes/+layout.server.js
 * Load initial data (records + stats + photos + groups) dari MySQL & filesystem saat SSR.
 * Data dikirim ke client sebagai props melalui layout.
 */
import { query } from '$lib/server/db.js';
import { transformTank } from '$lib/server/statusHelper.js';
import { getValidPhotos } from '$lib/server/photoHelper.js';

export async function load({ fetch, url, locals }) {
    const pathname = url.pathname;
    const user = locals.user || null;

    if (pathname === '/login') {
        return { pathname, user, records: [], stats: { total: 0, aman: 0, notice: 0, jatuh_tempo: 0, non_aktif: 0, groups: {} }, photos: [], groups: [] };
    }

    try {
        // 1. Ambil semua tangki dari MySQL
        const rows = await query('SELECT * FROM tanks ORDER BY group_name, estate');
        const records = rows.map(r => transformTank(r));

        // 2. Hitung stats
        const stats = buildStats(records);

        // 3. Ambil semua foto dari direktori filesystem & MySQL (Deduplikasi 1 file = 1 item)
        const photos = await getValidPhotos();

        // 4. Ambil groups
        let groups = [];
        try {
            const res = await fetch('/api/groups');
            if (res.ok) groups = await res.json();
        } catch (e) {}

        // 5. Ambil stok filter
        let stock = [];
        try {
            const res = await fetch('/api/stock');
            if (res.ok) stock = await res.json();
        } catch (e) {}

        return { pathname, user, records, stats, photos, groups, stock };
    } catch (err) {
        console.error('[layout.server] DB error:', err.message);
        
        // Tetap coba load foto dari direktori meskipun DB belum aktif
        const photos = await getValidPhotos().catch(() => []);

        return {
            pathname,
            user,
            records: [],
            stats: { total: 0, aman: 0, notice: 0, jatuh_tempo: 0, non_aktif: 0, groups: {} },
            photos: photos,
            groups: [],
            dbError: `Database belum tersambung: ${err.message}`
        };
    }
}

function buildStats(records) {
    const stats = {
        total: records.length,
        aman: 0, notice: 0, jatuh_tempo: 0, non_aktif: 0,
        groups: {}
    };
    records.forEach(r => {
        if (r.computed_status === 'AMAN')       stats.aman++;
        if (r.computed_status === 'NOTICE')      stats.notice++;
        if (r.computed_status === 'JATUH TEMPO') stats.jatuh_tempo++;
        if (r.computed_status === 'NON-AKTIF')   stats.non_aktif++;

        const g = r.group || 'Lainnya';
        if (!stats.groups[g]) stats.groups[g] = { total: 0, noticeCount: 0 };
        stats.groups[g].total++;
        if (r.computed_status === 'NOTICE' || r.computed_status === 'JATUH TEMPO') {
            stats.groups[g].noticeCount++;
        }
    });
    return stats;
}
