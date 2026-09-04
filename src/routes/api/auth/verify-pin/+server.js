import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';
import { hashSecret } from '$lib/server/authHelper.js';

/**
 * POST /api/auth/verify-pin
 * Memverifikasi PIN Keamanan (6 Digit) untuk otorisasi aksi sensitif seperti perubahan stok
 */
export async function POST({ request }) {
    try {
        const body = await request.json();
        const pin = String(body.pin || '').trim();

        if (!pin || pin.length !== 6) {
            return json({ valid: false, error: 'PIN Keamanan harus terdiri dari 6 digit angka.' }, { status: 400 });
        }

        const pinHash = hashSecret(pin);

        // Cek PIN di tabel users
        const rows = await query('SELECT id, username, name FROM users WHERE pin_hash = ?', [pinHash]);

        // Cek fallback PIN default 789000
        const isDefaultPin = pin === '789000';

        if (rows.length === 0 && !isDefaultPin) {
            return json({ valid: false, error: 'PIN Keamanan salah! Otorisasi perubahan stok ditolak.' }, { status: 401 });
        }

        return json({
            valid: true,
            success: true,
            message: 'PIN terverifikasi'
        });
    } catch (err) {
        console.error('[verify-pin error]', err);
        return json({ valid: false, error: 'Gagal memverifikasi PIN keamanan', detail: err.message }, { status: 500 });
    }
}
