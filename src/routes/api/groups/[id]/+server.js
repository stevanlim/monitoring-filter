/**
 * PATCH  /api/groups/[id]   → Edit nama atau deskripsi Group
 * DELETE /api/groups/[id]   → Hapus Group (dan seluruh tangki di dalamnya jika diizinkan)
 */
import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';

export async function PATCH({ params, request }) {
    try {
        const { id } = params;
        const body = await request.json();

        const newName = (body.name || '').trim();
        const oldName = (body.old_name || '').trim();

        if (!newName) {
            return json({ error: 'Nama Group tidak boleh kosong' }, { status: 400 });
        }

        // 1. Update di company_groups jika row exists
        if (!isNaN(parseInt(id))) {
            await query(
                `UPDATE company_groups 
                 SET name = ?, description = ?, contact_person = ?, contact_phone = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [newName, body.description || '', body.contact_person || '', body.contact_phone || '', parseInt(id)]
            );
        }

        // 2. Jika nama group berubah, update seluruh tangki di tabel tanks
        if (oldName && oldName !== newName) {
            await query('UPDATE tanks SET group_name = ? WHERE group_name = ?', [newName, oldName]);
        }

        return json({
            success: true,
            id: id,
            name: newName,
            description: body.description || '',
            contact_person: body.contact_person || '',
            contact_phone: body.contact_phone || ''
        });
    } catch (err) {
        console.error('[API /groups/[id] PATCH]', err);
        return json({ error: 'Gagal mengubah group perusahaan', detail: err.message }, { status: 500 });
    }
}

export async function DELETE({ params, url }) {
    try {
        const { id } = params;
        const groupName = url.searchParams.get('name');
        const deleteTanks = url.searchParams.get('deleteTanks') === 'true';

        // 1. Hapus dari company_groups jika ada ID angka
        if (!isNaN(parseInt(id))) {
            await query('DELETE FROM company_groups WHERE id = ?', [parseInt(id)]);
        }

        // 2. Jika ada groupName
        if (groupName) {
            await query('DELETE FROM company_groups WHERE name = ?', [groupName]);

            // Jika user memilih menghapus seluruh tangki di group ini
            if (deleteTanks) {
                // Hapus foto & history via FK ON DELETE CASCADE pada tabel tanks
                await query('DELETE FROM tanks WHERE group_name = ?', [groupName]);
            }
        }

        return json({
            success: true,
            message: `Group '${groupName || id}' berhasil dihapus`
        });
    } catch (err) {
        console.error('[API /groups/[id] DELETE]', err);
        return json({ error: 'Gagal menghapus group perusahaan', detail: err.message }, { status: 500 });
    }
}
