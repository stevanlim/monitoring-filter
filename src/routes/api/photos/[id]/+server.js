/**
 * DELETE /api/photos/[id]   → Hapus foto dari MySQL dan filesystem disk
 * Menerima query param: ?filepath=... jika foto berasal dari disk-only scan
 */
import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_BASE = join(process.cwd(), 'static', 'uploads');

export async function DELETE({ params, url }) {
    try {
        const { id } = params;
        const filepathParam = url.searchParams.get('filepath');

        // 1. Cari entri di database jika ID berupa angka
        let dbPhoto = null;
        if (!isNaN(parseInt(id))) {
            const photos = await query('SELECT * FROM photos WHERE id = ?', [parseInt(id)]);
            if (photos.length) dbPhoto = photos[0];
        }

        // 2. Jika tidak ditemukan by ID tapi ada filepathParam, cari by filepath
        if (!dbPhoto && filepathParam) {
            const cleanPath = filepathParam.replace(/\\/g, '/').replace(/^\/+/, '');
            const photos = await query('SELECT * FROM photos WHERE filepath = ? OR filepath = ?', [cleanPath, `/${cleanPath}`]);
            if (photos.length) dbPhoto = photos[0];
        }

        // 3. Tentukan file path fisik yang akan dihapus dari disk
        const targetRelPath = dbPhoto?.filepath || filepathParam;
        if (targetRelPath) {
            const cleanRel = targetRelPath.replace(/\\/g, '/').replace(/^\/+/, '');
            const fullPath = join(UPLOAD_BASE, cleanRel);
            if (existsSync(fullPath)) {
                await unlink(fullPath).catch((err) => console.warn('[DELETE photo unlink warning]', err));
            }
        }

        // 4. Hapus dari database MySQL jika ada entri
        if (dbPhoto) {
            await query('DELETE FROM photos WHERE id = ?', [dbPhoto.id]);
        } else if (filepathParam) {
            const cleanPath = filepathParam.replace(/\\/g, '/').replace(/^\/+/, '');
            await query('DELETE FROM photos WHERE filepath LIKE ?', [`%${cleanPath}%`]);
        }

        return json({ success: true, message: 'Foto berhasil dihapus dari disk dan database' });
    } catch (err) {
        console.error('[API /photos/[id] DELETE]', err);
        return json({ error: 'Gagal menghapus foto', detail: err.message }, { status: 500 });
    }
}
