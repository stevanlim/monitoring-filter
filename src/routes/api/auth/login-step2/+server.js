/**
 * POST /api/auth/login-step2
 * Verifikasi PIN 6 Digit dan Pembuatan Session Cookie
 */
import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';
import { hashSecret, consumeStep1Token, createSession } from '$lib/server/authHelper.js';

export async function POST({ request, cookies }) {
    try {
        const body = await request.json();
        const tempToken = (body.temp_token || '').trim();
        const pin = (body.pin || '').trim();

        if (!tempToken) {
            return json({ error: 'Sesi login tahap 1 telah kadaluarsa. Silakan ulangi login.' }, { status: 401 });
        }

        if (!pin || pin.length !== 6) {
            return json({ error: 'PIN Keamanan harus terdiri dari 6 digit angka.' }, { status: 400 });
        }

        const step1Data = consumeStep1Token(tempToken);
        if (!step1Data) {
            return json({ error: 'Token login tahap 1 tidak valid atau telah kadaluarsa.' }, { status: 401 });
        }

        const pinHash = hashSecret(pin);

        const rows = await query(
            'SELECT id, username, name, role FROM users WHERE id = ? AND pin_hash = ?',
            [step1Data.userId, pinHash]
        );

        if (rows.length === 0) {
            return json({ error: 'PIN Keamanan salah! Silakan coba lagi.' }, { status: 401 });
        }

        const user = rows[0];
        const { token, expiresAt } = await createSession(user.id);

        // Pasang HttpOnly cookie
        cookies.set('auth_session', token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: false, // True jika https
            expires: expiresAt
        });

        return json({
            success: true,
            message: 'Autentikasi 2-Tahap berhasil!',
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('[login-step2 Error]', err);
        return json({ error: 'Terjadi kesalahan sistem saat memverifikasi PIN', detail: err.message }, { status: 500 });
    }
}
