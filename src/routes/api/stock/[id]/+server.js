import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';

/** PATCH /api/stock/[id] — edit nama atau keterangan tipe filter */
export async function PATCH({ params, request }) {
    const id = Number(params.id);
    if (!id) return json({ error: 'ID tidak valid' }, { status: 400 });

    try {
        const body = await request.json();
        const { filter_name, notes } = body;

        const fields = [];
        const values = [];

        if (filter_name !== undefined) {
            fields.push('filter_name = ?');
            values.push(filter_name.trim());
        }
        if (notes !== undefined) {
            fields.push('notes = ?');
            values.push(notes ? notes.trim() : '');
        }

        if (!fields.length) {
            return json({ error: 'Tidak ada data yang diubah' }, { status: 400 });
        }

        values.push(id);
        await query(`UPDATE filter_stock SET ${fields.join(', ')} WHERE id = ?`, values);

        const updated = await query('SELECT * FROM filter_stock WHERE id = ?', [id]);
        if (!updated.length) return json({ error: 'Tipe filter tidak ditemukan' }, { status: 404 });

        return json(updated[0]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return json({ error: 'Nama tipe filter sudah digunakan' }, { status: 409 });
        }
        console.error('[PATCH /api/stock/[id]]', err);
        return json({ error: err.message }, { status: 500 });
    }
}

/** DELETE /api/stock/[id] — hapus tipe filter */
export async function DELETE({ params }) {
    const id = Number(params.id);
    if (!id) return json({ error: 'ID tidak valid' }, { status: 400 });

    try {
        const current = await query('SELECT * FROM filter_stock WHERE id = ?', [id]);
        if (!current.length) return json({ error: 'Tipe filter tidak ditemukan' }, { status: 404 });

        await query('DELETE FROM filter_stock WHERE id = ?', [id]);
        return json({ success: true, deleted: current[0] });
    } catch (err) {
        console.error('[DELETE /api/stock/[id]]', err);
        return json({ error: err.message }, { status: 500 });
    }
}
