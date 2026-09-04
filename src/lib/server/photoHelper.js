/**
 * src/lib/server/photoHelper.js
 * 
 * Helper untuk membaca foto dari direktori static/uploads dan database MySQL.
 * Menggabungkan info DB + validasi file fisik di disk sehingga:
 * 1. Tidak akan pernah ada duplikat foto (1 file fisik = 1 entri).
 * 2. File yang dimasukkan langsung ke folder disk otomatis terbaca.
 * 3. File yang sudah tidak ada di disk tidak akan dimunculkan.
 */
import { query } from '$lib/server/db.js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_BASE = join(process.cwd(), 'static', 'uploads');

/**
 * Ambil daftar foto yang valid (file fisik ada di disk & deduplikasi by filepath)
 * @param {object} [filters] - { group, region, estate }
 */
export async function getValidPhotos(filters = {}) {
    const { group: groupFilter, region: regionFilter, estate: estateFilter } = filters;

    // 1. Ambil data foto dari MySQL
    let dbPhotos = [];
    try {
        const rows = await query(`
            SELECT 
                p.id, p.tank_id, p.maintenance_id, p.filename, p.filepath, p.caption, p.uploader, p.taken_date, p.created_at,
                t.group_name, t.region, t.estate, t.equipment, t.tank_capacity
            FROM photos p
            LEFT JOIN tanks t ON p.tank_id = t.id
            ORDER BY p.id ASC
        `);
        dbPhotos = rows;
    } catch (err) {
        console.warn('[photoHelper] MySQL query warning:', err.message);
    }

    // Map by filepath untuk metadata dari DB
    const dbMapByPath = new Map();
    for (const row of dbPhotos) {
        const normalized = normalizePath(row.filepath);
        if (!dbMapByPath.has(normalized)) {
            dbMapByPath.set(normalized, row);
        }
        // Also map just the filename in case folder structure had slight naming variance
        if (row.filename && !dbMapByPath.has(row.filename)) {
            dbMapByPath.set(row.filename, row);
        }
    }

    // 2. Scan file fisik di direktori static/uploads
    const diskPhotos = await scanUploadsDir(UPLOAD_BASE);

    // 3. Gabungkan disk photos dengan info DB (Deduplikasi terjamin 1 file = 1 foto)
    const result = [];
    const seenPaths = new Set();

    for (const item of diskPhotos) {
        const normPath = normalizePath(item.relPath);
        if (seenPaths.has(normPath)) continue;
        seenPaths.add(normPath);

        const dbInfo = dbMapByPath.get(normPath) || dbMapByPath.get(item.filename);

        const groupName = dbInfo?.group_name || item.group || 'CBI Group';
        const region    = dbInfo?.region     || item.region || 'Umum';
        const estate    = dbInfo?.estate     || item.estate || 'Estate';

        // Terapkan filter jika ada
        if (groupFilter && groupFilter !== 'ALL' && groupName !== groupFilter && item.group !== groupFilter) continue;
        if (regionFilter && regionFilter !== 'ALL' && region !== regionFilter && item.region !== regionFilter) continue;
        if (estateFilter && estateFilter !== 'ALL' && estate !== estateFilter && item.estate !== estateFilter) continue;

        const dateVal = dbInfo?.taken_date || item.mtime;
        const dateStr = dateVal instanceof Date 
            ? dateVal.toISOString().split('T')[0] 
            : String(dateVal || '').split('T')[0];

        result.push({
            id:            dbInfo?.id || `DISK_${hashString(normPath)}`,
            tank_id:       dbInfo?.tank_id || null,
            maintenance_id: dbInfo?.maintenance_id || null,
            filename:      item.filename,
            filepath:      normPath,
            url:           `/uploads/${normPath}`,
            date:          dateStr,
            caption:       dbInfo?.caption || `Dokumentasi Maintenance ${estate}`,
            uploader:      dbInfo?.uploader || 'Teknisi Field',
            group:         groupName,
            region:        region,
            estate:        estate,
            equipment:     dbInfo?.equipment || 'MicroClean Filter',
            unit_name:     dbInfo?.tank_capacity || 'Tangki Timbun Solar',
            tank_capacity: dbInfo?.tank_capacity || 'Tangki Timbun Solar'
        });
    }

    return result;
}

/**
 * Scan rekursif folder static/uploads/[group]/[region]/[estate]/[file]
 */
async function scanUploadsDir(baseDir) {
    const list = [];
    if (!existsSync(baseDir)) return list;

    try {
        const groups = await readdir(baseDir, { withFileTypes: true });
        for (const g of groups) {
            if (!g.isDirectory()) continue;
            const groupName = g.name.replace(/_/g, ' ');
            const groupPath = join(baseDir, g.name);

            const regions = await readdir(groupPath, { withFileTypes: true });
            for (const r of regions) {
                if (!r.isDirectory()) continue;
                const regionName = r.name.replace(/_/g, ' ');
                const regionPath = join(groupPath, r.name);

                const estates = await readdir(regionPath, { withFileTypes: true });
                for (const e of estates) {
                    if (!e.isDirectory()) continue;
                    const estateName = e.name.replace(/_/g, ' ');
                    const estatePath = join(regionPath, e.name);

                    const files = await readdir(estatePath, { withFileTypes: true });
                    for (const f of files) {
                        if (f.isFile() && isImageFile(f.name)) {
                            const fullPath = join(estatePath, f.name);
                            const fileStat = await stat(fullPath).catch(() => null);
                            const relPath = `${g.name}/${r.name}/${e.name}/${f.name}`;

                            list.push({
                                filename: f.name,
                                relPath:  relPath,
                                group:    groupName,
                                region:   regionName,
                                estate:   estateName,
                                mtime:    fileStat?.mtime || new Date()
                            });
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error('[scanUploadsDir] Error:', err);
    }

    return list;
}

function isImageFile(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext);
}

function normalizePath(p) {
    return (p || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}
