/**
 * MySQL Connection Pool — Server-side only (SvelteKit)
 * d:\test\program_monitoring\monitoring-filter\src\lib\server\db.js
 *
 * Gunakan hanya di file +server.js atau .server.js
 * Jangan diimport di komponen Svelte atau browser-side code!
 */
import mysql from 'mysql2/promise';
import {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASS,
    DB_NAME
} from '$env/static/private';

/** @type {mysql.Pool} */
let _pool = null;

/**
 * Ambil singleton connection pool
 * @returns {mysql.Pool}
 */
export function getPool() {
    if (!_pool) {
        _pool = mysql.createPool({
            host:               DB_HOST    || 'localhost',
            port:               parseInt(DB_PORT || '3306'),
            user:               DB_USER    || 'root',
            password:           DB_PASS    || '',
            database:           DB_NAME    || 'filter_monitoring',
            waitForConnections: true,
            connectionLimit:    10,
            queueLimit:         0,
            charset:            'utf8mb4',
            timezone:           '+07:00',
            dateStrings:        true // Kembalikan DATE/DATETIME sebagai raw string agar tidak bergeser zona waktu UTC
        });
    }
    return _pool;
}

/**
 * Helper query — pakai parameterized query agar aman dari SQL injection
 * @param {string} sql
 * @param {any[]} [params]
 */
export async function query(sql, params = []) {
    const pool = getPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
}

/**
 * Helper untuk insert satu baris, return insertId
 * @param {string} table
 * @param {Record<string, any>} data
 */
export async function insert(table, data) {
    const cols = Object.keys(data).map(k => `\`${k}\``).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const pool = getPool();
    const [result] = await pool.execute(
        `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
        values
    );
    return result.insertId;
}
