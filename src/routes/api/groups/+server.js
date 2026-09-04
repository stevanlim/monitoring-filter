/**
 * GET  /api/groups  → Ambil daftar seluruh Group Perusahaan beserta ringkasan jumlah tangki & notice
 * POST /api/groups  → Tambah Group Perusahaan baru
 */
import { json } from '@sveltejs/kit';
import { query, insert } from '$lib/server/db.js';
import { computeStatus, formatLocalDate } from '$lib/server/statusHelper.js';

// Auto-create table company_groups jika belum ada
async function ensureGroupsTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS \`company_groups\` (
                \`id\`             INT NOT NULL AUTO_INCREMENT,
                \`name\`           VARCHAR(100) NOT NULL UNIQUE,
                \`description\`    VARCHAR(255) NULL DEFAULT '',
                \`contact_person\` VARCHAR(150) NULL DEFAULT '',
                \`contact_phone\`  VARCHAR(50)  NULL DEFAULT '',
                \`created_at\`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                INDEX \`idx_group_name\` (\`name\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    } catch (err) {
        console.warn('[ensureGroupsTable]', err.message);
    }
}

export async function GET() {
    try {
        await ensureGroupsTable();

        // 1. Ambil data dari master table company_groups
        let masterGroups = [];
        try {
            masterGroups = await query('SELECT * FROM company_groups ORDER BY name ASC');
        } catch (err) {
            masterGroups = [];
        }

        // 2. Ambil semua tangki untuk menghitung statistik per group
        let tanks = [];
        try {
            tanks = await query('SELECT id, group_name, region, estate, status_mc, next_maintenance FROM tanks');
        } catch (err) {
            tanks = [];
        }

        // Hitung breakdown per group
        const groupStats = {};
        for (const t of tanks) {
            const g = t.group_name || 'Lainnya';
            if (!groupStats[g]) {
                groupStats[g] = {
                    totalTanks: 0,
                    noticeCount: 0,
                    estates: new Set(),
                    regions: new Set()
                };
            }
            groupStats[g].totalTanks++;
            if (t.estate) groupStats[g].estates.add(t.estate);
            if (t.region) groupStats[g].regions.add(t.region);

            const computed = computeStatus({
                id: t.id,
                status_mc: t.status_mc,
                next_maintenance: formatLocalDate(t.next_maintenance)
            });

            if (computed.computed_status === 'NOTICE' || computed.computed_status === 'JATUH TEMPO') {
                groupStats[g].noticeCount++;
            }
        }

        // Gabungkan master groups + groups yang ada di tabel tanks
        const allGroupNames = new Set([
            ...masterGroups.map(g => g.name),
            ...Object.keys(groupStats)
        ]);

        const masterMap = new Map(masterGroups.map(g => [g.name, g]));

        const results = Array.from(allGroupNames).filter(Boolean).map((name, index) => {
            const master = masterMap.get(name);
            const stats = groupStats[name] || { totalTanks: 0, noticeCount: 0, estates: new Set(), regions: new Set() };

            return {
                id: master?.id || `GRP_${index + 1}`,
                name: name,
                description: master?.description || '',
                contact_person: master?.contact_person || '',
                contact_phone: master?.contact_phone || '',
                total_tanks: stats.totalTanks,
                total_estates: stats.estates.size,
                total_regions: stats.regions.size,
                notice_count: stats.noticeCount,
                created_at: master?.created_at || new Date().toISOString()
            };
        });

        // Urutkan alfabetis
        results.sort((a, b) => a.name.localeCompare(b.name));

        return json(results);
    } catch (err) {
        console.error('[API /groups GET]', err);
        return json({ error: 'Gagal memuat data group perusahaan', detail: err.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        await ensureGroupsTable();
        const body = await request.json();

        const name = (body.name || '').trim();
        if (!name) {
            return json({ error: 'Nama Group Perusahaan wajib diisi' }, { status: 400 });
        }

        // Cek duplikasi
        const existing = await query('SELECT id FROM company_groups WHERE name = ?', [name]);
        if (existing.length > 0) {
            return json({ error: `Group '${name}' sudah terdaftar` }, { status: 400 });
        }

        const insertId = await insert('company_groups', {
            name: name,
            description: body.description || '',
            contact_person: body.contact_person || '',
            contact_phone: body.contact_phone || ''
        });

        return json({
            id: insertId,
            name: name,
            description: body.description || '',
            contact_person: body.contact_person || '',
            contact_phone: body.contact_phone || '',
            total_tanks: 0,
            total_estates: 0,
            total_regions: 0,
            notice_count: 0
        }, { status: 201 });
    } catch (err) {
        console.error('[API /groups POST]', err);
        return json({ error: 'Gagal menambah group perusahaan', detail: err.message }, { status: 500 });
    }
}
