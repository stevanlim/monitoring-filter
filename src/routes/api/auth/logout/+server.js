/**
 * POST /api/auth/logout
 * Menghapus session database dan membersihkan auth cookie
 */
import { json } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/authHelper.js';

export async function POST({ cookies }) {
    try {
        const sessionToken = cookies.get('auth_session');
        if (sessionToken) {
            await deleteSession(sessionToken);
            cookies.delete('auth_session', { path: '/' });
        }
        return json({ success: true, message: 'Berhasil keluar' });
    } catch (err) {
        console.error('[logout Error]', err);
        return json({ error: 'Gagal logout', detail: err.message }, { status: 500 });
    }
}
