import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';

// Auto-create tabel filter_stock + seed data awal
async function ensureFilterStockTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS \`filter_stock\` (
            \`id\`           INT NOT NULL AUTO_INCREMENT,
            \`filter_name\`  VARCHAR(100) NOT NULL,
            \`quantity\`     INT NOT NULL DEFAULT 0,
            \`min_quantity\` INT NOT NULL DEFAULT 3,
            \`notes\`        TEXT,
            \`created_at\`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`),
            UNIQUE KEY \`uk_filter_name\` (\`filter_name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Seed data awal jika tabel kosong
    const existing = await query('SELECT COUNT(*) as cnt FROM filter_stock');
    if (existing[0].cnt === 0) {
        await query(`
            INSERT INTO filter_stock (filter_name, quantity, min_quantity, notes) VALUES
            ('MDF 250-1',          10, 3, 'Filter utama MicroClean Diesel Filter 250 - Tipe 1'),
            ('MDF 250-516',         8, 3, 'Filter MicroClean Diesel Filter 250 - Tipe 516'),
            ('FEC 250',            15, 5, 'Filter Element FEC 250 — Kode: N16.0288002.00569'),
            ('Tabung MDF 250',      5, 2, 'Tabung housing MDF 250 — Kode: N16.0066001.00024'),
            ('Automatic Hose Reel', 4, 2, 'Automatic Fuel Hose Reel — Kode: N16.0692002.00013')
        `);
    }
}

/** GET /api/stock — ambil semua tipe filter */
export async function GET() {
    try {
        await ensureFilterStockTable();
        const rows = await query(
            'SELECT * FROM filter_stock ORDER BY filter_name ASC'
        );
        return json(rows);
    } catch (err) {
        console.error('[GET /api/stock]', err);
        return json({ error: err.message }, { status: 500 });
    }
}

/** POST /api/stock — tambah tipe filter baru */
export async function POST({ request }) {
    try {
        await ensureFilterStockTable();
        const { filter_name, quantity = 0, min_quantity = 3, notes = '' } = await request.json();

        if (!filter_name || !filter_name.trim()) {
            return json({ error: 'Nama tipe filter wajib diisi' }, { status: 400 });
        }

        const result = await query(
            'INSERT INTO filter_stock (filter_name, quantity, min_quantity, notes) VALUES (?, ?, ?, ?)',
            [filter_name.trim(), Number(quantity), Number(min_quantity), notes]
        );

        const newRow = await query('SELECT * FROM filter_stock WHERE id = ?', [result.insertId]);
        return json(newRow[0], { status: 201 });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return json({ error: `Tipe filter "${err.sqlMessage?.match(/'([^']+)'/)?.[1]}" sudah ada` }, { status: 409 });
        }
        console.error('[POST /api/stock]', err);
        return json({ error: err.message }, { status: 500 });
    }
}
