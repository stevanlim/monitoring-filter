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

        const cleanUsername = (username || '').trim().toLowerCase();
        const passHash = hashSecret(password);

        console.log('[login-step1 Attempt]', {
            inputUsername: username,
            cleanUsername,
            inputPassLength: password.length,
            generatedHash: passHash
        });

        // Izinkan login dengan username ATAU nama (case-insensitive)
        const rows = await query(
            'SELECT id, username, name, role, password_hash FROM users WHERE LOWER(username) = ? OR LOWER(name) = ?',
            [cleanUsername, cleanUsername]
        );

        console.log('[login-step1 User Found]', rows.length > 0 ? { id: rows[0].id, username: rows[0].username, name: rows[0].name, storedHash: rows[0].password_hash, match: rows[0].password_hash === passHash } : 'USER NOT FOUND');

        if (rows.length === 0) {
            return json({ error: 'Username / Nama Pengguna tidak terdaftar' }, { status: 401 });
        }

        if (rows[0].password_hash !== passHash) {
            return json({ error: 'Password yang Anda masukkan salah' }, { status: 401 });
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
