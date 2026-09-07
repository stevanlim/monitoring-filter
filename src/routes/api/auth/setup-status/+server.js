/**
 * GET /api/auth/setup-status
 * Mengecek apakah sistem belum memiliki akun (mode registrasi pertama kali)
 */
import { json } from '@sveltejs/kit';
import { getUserCount } from '$lib/server/authHelper.js';

export async function GET() {
    try {
        const count = await getUserCount();
        return json({
            can_register: count === 0,
            has_user: count > 0,
            user_count: count
        });
    } catch (err) {
        console.error('[setup-status error]', err);
        return json({ can_register: false, has_user: false, error: err.message }, { status: 500 });
    }
}
