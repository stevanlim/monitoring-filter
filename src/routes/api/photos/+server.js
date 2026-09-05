/**
 * GET  /api/photos         → Ambil daftar foto (filter: group, region, estate)
 * POST /api/photos         → Upload foto baru (multipart/form-data)
 *                            Simpan file ke static/uploads/[group]/[region]/[estate]/
 *                            Simpan path ke tabel photos di MySQL
 */
import { json } from '@sveltejs/kit';
import { query, insert } from '$lib/server/db.js';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

// Base upload directory — relatif dari root project SvelteKit
const UPLOAD_BASE = join(process.cwd(), 'static', 'uploads');

import { getValidPhotos } from '$lib/server/photoHelper.js';
import { formatLocalDate, getTodayLocal } from '$lib/server/statusHelper.js';

export async function GET({ url }) {
    try {
        const groupFilter  = url.searchParams.get('group');
        const regionFilter = url.searchParams.get('region');
        const estateFilter = url.searchParams.get('estate');

        const photos = await getValidPhotos({
            group:  groupFilter,
            region: regionFilter,
            estate: estateFilter
        });

        return json(photos);
    } catch (err) {
        console.error('[API /photos GET]', err);
        return json({ error: 'Gagal mengambil daftar foto', detail: err.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const formData = await request.formData();

        const tankId     = formData.get('tank_id');
        const maintId    = formData.get('maintenance_id') || null;
        const caption    = formData.get('caption') || '';
        const uploader   = formData.get('uploader') || 'Teknisi Field';
        const takenDate  = formatLocalDate(formData.get('taken_date')) || getTodayLocal();
        const file       = formData.get('photo');

        if (!tankId || !file || !file.name) {
            return json({ error: 'tank_id dan file foto wajib ada' }, { status: 400 });
        }

        // Ambil info tangki untuk path folder (termasuk location_type)
        const tanks = await query('SELECT group_name, region, estate, location_type FROM tanks WHERE id = ?', [tankId]);
        if (!tanks.length) {
            return json({ error: 'Tangki tidak ditemukan' }, { status: 404 });
        }

        const tank = tanks[0];
        const groupSafe    = sanitizeFolderName(tank.group_name);
        const regionSafe   = sanitizeFolderName(tank.region || 'Umum');
        const estateSafe   = sanitizeFolderName(tank.estate);
        // Gunakan location_type sebagai subfolder (misal: Kebun, Pabrik, Workshop, dll.)
        const locTypeSafe  = sanitizeFolderName(tank.location_type || 'Kebun');

        // Buat direktori jika belum ada: Group/Region/Estate/LocType/
        const folderPath = join(UPLOAD_BASE, groupSafe, regionSafe, estateSafe, locTypeSafe);
        if (!existsSync(folderPath)) {
            await mkdir(folderPath, { recursive: true });
        }

        // Generate nama file unik
        const ext      = extname(file.name) || '.jpg';
        const timestamp = Date.now();
        const filename  = `filter_${timestamp}${ext}`;
        const fullPath  = join(folderPath, filename);

        // Simpan file ke disk
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(fullPath, buffer);

        // Relative path untuk DB (tanpa 'static/'): Group/Region/Estate/LocType/file
        const relPath = `${groupSafe}/${regionSafe}/${estateSafe}/${locTypeSafe}/${filename}`;

        // Insert ke tabel photos
        const photoId = await insert('photos', {
            tank_id:        parseInt(tankId),
            maintenance_id: maintId ? parseInt(maintId) : null,
            filename:       filename,
            filepath:       relPath,
            caption:        caption,
            uploader:       uploader,
            taken_date:     takenDate
        });

        return json({
            success:  true,
            photo_id: photoId,
            filepath: relPath,
            url:      `/uploads/${relPath}`,
            filename: filename
        }, { status: 201 });
    } catch (err) {
        console.error('[API /photos POST]', err);
        return json({ error: 'Gagal upload foto', detail: err.message }, { status: 500 });
    }
}

/** Sanitize nama folder: hapus karakter berbahaya, ganti spasi dengan _ */
function sanitizeFolderName(name) {
    return (name || 'unknown')
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .trim();
}
