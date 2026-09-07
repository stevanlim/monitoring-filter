/**
 * src/lib/server/authHelper.js
 * Manajemen Autentikasi, Password/PIN Hashing, Session, dan Auto-Seed Database
 */
import crypto from 'crypto';
import { query, insert } from '$lib/server/db.js';

const SALT = 'MicroClean_Secure_Salt_2026';

/**
 * Hash string (password atau PIN) dengan SHA-256 + Salt
 */
export function hashSecret(secret) {
    return crypto
        .createHash('sha256')
        .update(`${secret}_${SALT}`)
        .digest('hex');
}

/**
 * Buat random session token
 */
export function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Inisialisasi tabel `users` dan `sessions` jika belum ada.
 * Tidak ada kredensial hardcoded; pendaftaran akun pertama dilakukan oleh konsumen.
 */
export async function ensureAuthSchemaAndSeed() {
    try {
        // 1. Buat tabel users
        await query(`
            CREATE TABLE IF NOT EXISTS \`users\` (
                \`id\`            INT NOT NULL AUTO_INCREMENT,
                \`username\`      VARCHAR(50)  NOT NULL UNIQUE,
                \`password_hash\` VARCHAR(128) NOT NULL,
                \`pin_hash\`      VARCHAR(128) NOT NULL,
                \`name\`          VARCHAR(100) NOT NULL DEFAULT 'Admin MicroClean',
                \`role\`          VARCHAR(30)  NOT NULL DEFAULT 'admin',
                \`created_at\`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                INDEX \`idx_username\` (\`username\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Buat tabel sessions
        await query(`
            CREATE TABLE IF NOT EXISTS \`sessions\` (
                \`id\`         VARCHAR(64)  NOT NULL,
                \`user_id\`    INT          NOT NULL,
                \`created_at\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`expires_at\` DATETIME     NOT NULL,
                PRIMARY KEY (\`id\`),
                INDEX \`idx_user_id\` (\`user_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    } catch (err) {
        console.error('[Auth Init Error]', err);
    }
}

export const ensureAuthSchema = ensureAuthSchemaAndSeed;

/**
 * Cek jumlah akun terdaftar di sistem
 * @returns {Promise<number>}
 */
export async function getUserCount() {
    await ensureAuthSchemaAndSeed();
    try {
        const rows = await query('SELECT COUNT(*) as count FROM users');
        return Number(rows[0]?.count || 0);
    } catch (err) {
        console.error('[getUserCount Error]', err);
        return 0;
    }
}

/**
 * Validasi session token dari cookie
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export async function validateSession(token) {
    if (!token) return null;
    try {
        await ensureAuthSchemaAndSeed();

        const sql = `
            SELECT s.id as session_id, s.expires_at, u.id as user_id, u.username, u.name, u.role
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ? AND s.expires_at > NOW()
            LIMIT 1
        `;
        const rows = await query(sql, [token]);
        if (rows.length > 0) {
            return rows[0];
        }
        return null;
    } catch (err) {
        console.error('[validateSession Error]', err);
        return null;
    }
}

/**
 * Buat session baru di database (berlaku 1 jam / 60 menit)
 */
export async function createSession(userId, durationMinutes = 60) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000); // 1 jam

    await query(
        'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
        [token, userId, durationMinutes]
    );

    return { token, expiresAt };
}

/**
 * Hapus session dari database saat logout
 */
export async function deleteSession(token) {
    if (!token) return;
    try {
        await query('DELETE FROM sessions WHERE id = ?', [token]);
    } catch (err) {
        console.error('[deleteSession Error]', err);
    }
}

/**
 * Buat temporary step-1 token (berlaku 5 menit untuk lanjut ke input PIN)
 */
const tempStep1Tokens = new Map();

export function createStep1Token(userId, username) {
    const tempToken = generateToken();
    tempStep1Tokens.set(tempToken, {
        userId,
        username,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 menit
    });
    return tempToken;
}

export function verifyStep1Token(tempToken) {
    if (!tempToken) return null;
    const data = tempStep1Tokens.get(tempToken);
    if (!data) return null;
    if (Date.now() > data.expiresAt) {
        tempStep1Tokens.delete(tempToken);
        return null;
    }
    return data;
}

export function consumeStep1Token(tempToken) {
    const data = verifyStep1Token(tempToken);
    if (data) {
        tempStep1Tokens.delete(tempToken);
    }
    return data;
}
