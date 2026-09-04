/**
 * GET /api/auth/me
 * Mengambil informasi user yang sedang aktif login
 */
import { json } from '@sveltejs/kit';
import { validateSession } from '$lib/server/authHelper.js';

export async function GET({ cookies }) {
    const sessionToken = cookies.get('auth_session');
    if (!sessionToken) {
        return json({ authenticated: false }, { status: 401 });
    }

    const sessionUser = await validateSession(sessionToken);
    if (!sessionUser) {
        cookies.delete('auth_session', { path: '/' });
        return json({ authenticated: false }, { status: 401 });
    }

    return json({
        authenticated: true,
        user: {
            id: sessionUser.user_id,
            username: sessionUser.username,
            name: sessionUser.name,
            role: sessionUser.role
        }
    });
}
