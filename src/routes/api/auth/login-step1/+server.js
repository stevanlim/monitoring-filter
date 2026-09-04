/**
 * POST /api/auth/login-step1
 * Verifikasi Username dan Password
 */
import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';
import { hashSecret, createStep1Token, ensureAuthSchemaAndSeed } from '$lib/server/authHelper.js';

export async function POST({ request }) {
    try {
        await ensureAuthSchemaAndSeed();

        const body = await request.json();
        const username = (body.username || '').trim();
        const password = (body.password || '').trim();

        if (!username || !password) {
            return json({ error: 'Username dan Password wajib diisi' }, { status: 400 });
        }

        const passHash = hashSecret(password);

        const rows = await query(
            'SELECT id, username, name, role FROM users WHERE username = ? AND password_hash = ?',
            [username, passHash]
        );

        if (rows.length === 0) {
            return json({ error: 'Username atau Password tidak cocok' }, { status: 401 });
        }

        const user = rows[0];
        const tempToken = createStep1Token(user.id, user.username);

        return json({
            success: true,
            message: 'Kredensial valid. Silakan masukkan PIN 6-Digit',
            temp_token: tempToken,
            user: {
                username: user.username,
                name: user.name
            }
        });
    } catch (err) {
        console.error('[login-step1 Error]', err);
        return json({ error: 'Terjadi kesalahan sistem saat memvalidasi akun', detail: err.message }, { status: 500 });
    }
}
