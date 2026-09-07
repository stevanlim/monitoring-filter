/**
 * POST /api/auth/register
 * Pendaftaran akun pengelola pertama kali (hanya bisa dilakukan SEKALI saat database masih kosong)
 */
import { json } from '@sveltejs/kit';
import { query, insert } from '$lib/server/db.js';
import { getUserCount, hashSecret, createSession, ensureAuthSchema } from '$lib/server/authHelper.js';

export async function POST({ request, cookies }) {
    try {
        await ensureAuthSchema();

        // 1. Pastikan sistem belum memiliki akun sama sekali
        const existingCount = await getUserCount();
        if (existingCount > 0) {
            return json(
                { error: 'Pendaftaran ditutup! Akun sistem utama sudah terdaftar sebelumnya.' },
                { status: 403 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const name = (body.name || '').trim();
        const username = (body.username || '').trim().toLowerCase();
        const password = (body.password || '').trim();
        const pin = String(body.pin || '').trim();

        // 2. Validasi input
        if (!name) {
            return json({ error: 'Nama Lengkap / Nama Perusahaan wajib diisi.' }, { status: 400 });
        }

        if (!username || username.length < 3) {
            return json({ error: 'Username minimal terdiri dari 3 karakter.' }, { status: 400 });
        }

        if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
            return json({ error: 'Username hanya boleh berisi huruf, angka, titik, underscore, atau tanda hubung.' }, { status: 400 });
        }

        if (!password || password.length < 6) {
            return json({ error: 'Password minimal terdiri dari 6 karakter.' }, { status: 400 });
        }

        if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            return json({ error: 'PIN Keamanan harus persis terdiri dari 6 digit angka (0-9).' }, { status: 400 });
        }

        // 3. Hash password dan PIN dengan secure salt
        const passwordHash = hashSecret(password);
        const pinHash = hashSecret(pin);

        // 4. Simpan ke database
        const insertId = await insert('users', {
            username:      username,
            password_hash: passwordHash,
            pin_hash:      pinHash,
            name:          name,
            role:          'admin'
        });

        // 5. Buat sesi login otomatis (1 jam)
        const { token, expiresAt } = await createSession(insertId, 60);

        cookies.set('auth_session', token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            expires: expiresAt,
            maxAge: 60 * 60 // 1 jam (3600 detik)
        });

        return json({
            success: true,
            message: 'Akun pengelola berhasil didaftarkan!',
            user: {
                id: insertId,
                username: username,
                name: name,
                role: 'admin'
            }
        });
    } catch (err) {
        console.error('[register error]', err);
        return json(
            { error: 'Terjadi kesalahan sistem saat mendaftarkan akun', detail: err.message },
            { status: 500 }
        );
    }
}
