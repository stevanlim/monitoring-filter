/**
 * src/routes/api/export/excel/+server.js
 * API endpoint untuk generate dan export file Excel resmi MicroClean
 * Format 100% mengikuti template klien:
 * - Logo banner MicroClean di pojok kiri atas
 * - Judul: Rekapan Monitoring Maintenance MC [GROUP] [WILAYAH]
 * - Header 2 baris warna kuning (#FFFF00), border hitam tipis
 * - Subheader baris pemisah provinsi warna peach (#FCE4D6)
 * - Kolom maintenance DINAMIS (minimal 5 kolom: Pertama, Kedua, Ketiga, Keempat, Kelima, dan otomatis bertambah jika ada banyak riwayat)
 * - Teks tanggal: Hitam (sudah servis), Biru (jadwal berikutnya), Merah (jatuh tempo/lewat jadwal)
 * - Legend & catatan di bagian bawah
 */
import { query } from '$lib/server/db.js';
import { transformTank } from '$lib/server/statusHelper.js';
import { getIslandFromRegion, normalizeProvinceCode } from '$lib/utils/regionHelper.js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

// Format tanggal ke format DD-MMM-YY (misal: 11-Mar-26)
function formatExcelDate(dateStr) {
    if (!dateStr) return '';
    const clean = String(dateStr).split('T')[0].split(' ')[0].trim();
    const parts = clean.split('-');
    if (parts.length !== 3) return clean;

    const year = parts[0].slice(-2);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mStr = months[monthIdx] || parts[1];
    return `${day}-${mStr}-${year}`;
}

// Nama kolom maintenance bertingkat (Pertama, Kedua, ... Kelima, Keenam, dst.)
function getMaintColName(idx) {
    const ordinals = [
        'Pertama',
        'Kedua',
        'Ketiga',
        'Keempat',
        'Kelima',
        'Keenam',
        'Ketujuh',
        'Kedelapan',
        'Kesembilan',
        'Kesepuluh',
        'Ke-11',
        'Ke-12',
        'Ke-13',
        'Ke-14',
        'Ke-15',
        'Ke-16',
        'Ke-17',
        'Ke-18',
        'Ke-19',
        'Ke-20',
        'Ke-21',
        'Ke-22',
        'Ke-23',
        'Ke-24',
        'Ke-25',
        'Ke-26',
        'Ke-27',
        'Ke-28',
        'Ke-29',
        'Ke-30'
    ];
    const name = idx < ordinals.length ? ordinals[idx] : `Ke-${idx + 1}`;
    return `Maintenance\n${name}`;
}

export async function POST({ request }) {
    try {
        const body = await request.json().catch(() => ({}));
        const tankIds = body.tankIds || null;
        const filterGroup = body.filterGroup || 'ALL';

        // 1. Ambil data tangki dari database
        let tanks = [];
        if (tankIds && Array.isArray(tankIds) && tankIds.length > 0) {
            const placeholders = tankIds.map(() => '?').join(',');
            const rows = await query(
                `SELECT * FROM tanks WHERE id IN (${placeholders}) ORDER BY group_name, region, estate`,
                tankIds
            );
            tanks = rows.map(r => transformTank(r));
        } else if (filterGroup && filterGroup !== 'ALL') {
            const rows = await query(
                'SELECT * FROM tanks WHERE group_name = ? ORDER BY region, estate',
                [filterGroup]
            );
            tanks = rows.map(r => transformTank(r));
        } else {
            const rows = await query('SELECT * FROM tanks ORDER BY group_name, region, estate');
            tanks = rows.map(r => transformTank(r));
        }

        if (tanks.length === 0) {
            return new Response(JSON.stringify({ error: 'Tidak ada data untuk diekspor' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Ambil riwayat maintenance untuk tangki-tangki ini
        const allIds = tanks.map(t => t.id);
        const placeholders = allIds.map(() => '?').join(',');
        let historyRows = [];
        if (allIds.length > 0) {
            historyRows = await query(
                `SELECT * FROM maintenance_history WHERE tank_id IN (${placeholders}) ORDER BY service_date ASC`,
                allIds
            );
        }

        // Map tank_id -> array of services
        const historyByTank = {};
        for (const h of historyRows) {
            if (!historyByTank[h.tank_id]) historyByTank[h.tank_id] = [];
            historyByTank[h.tank_id].push(h);
        }

        // 3. Kelompokkan tangki berdasarkan Group & Pulau (Island)
        // Group -> Island -> Province -> tanks[]
        const groupedData = {};
        for (const t of tanks) {
            const grp = t.group || 'ALL GROUP';
            const island = getIslandFromRegion(t.region);
            const prov = normalizeProvinceCode(t.region);

            if (!groupedData[grp]) groupedData[grp] = {};
            if (!groupedData[grp][island]) groupedData[grp][island] = {};
            if (!groupedData[grp][island][prov]) groupedData[grp][island][prov] = [];

            groupedData[grp][island][prov].push(t);
        }

        // 4. Inisialisasi ExcelJS Workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'PT. Anugerah Rezeki Teknindo';
        workbook.lastModifiedBy = 'MicroClean Monitoring System';
        workbook.created = new Date();

        // Cari logo MicroClean banner
        const logoPath = path.resolve('static/images/microclean_logo_banner.png');
        let logoImageId = null;
        if (fs.existsSync(logoPath)) {
            logoImageId = workbook.addImage({
                filename: logoPath,
                extension: 'png'
            });
        }

        // Styling Reusable
        const borderThin = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };

        const yellowHeaderFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' } // Bright Yellow
        };

        const peachSubheaderFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFCE4D6' } // Soft Peach / Salmon
        };

        // 5. Buat Worksheet untuk setiap kombinasi Group & Pulau
        for (const [grpName, islands] of Object.entries(groupedData)) {
            for (const [islandName, provinces] of Object.entries(islands)) {
                // Hitung jumlah kolom maintenance yang dibutuhkan secara DINAMIS
                // Mengikuti kebutuhan aktual sheet ini (tidak dipaksa harus 5 kolom agar menghemat space)
                let maxSlots = 0;
                for (const provTanks of Object.values(provinces)) {
                    for (const t of provTanks) {
                        const histLen = (historyByTank[t.id] || []).length;
                        const reqSlots = histLen + (t.next_maintenance ? 1 : 0);
                        if (reqSlots > maxSlots) {
                            maxSlots = reqSlots;
                        }
                    }
                }
                const numMaintCols = Math.max(1, maxSlots);
                // totalCols = No + Estate + Lokasi + Unit + TipeFilter + JmlUnitMC + Pemasangan + numMaint + StatusMC + KontakPIC + Note
                const totalCols = 10 + numMaintCols;

                // Buat nama sheet max 31 char
                let sheetTitle = `${grpName} ${islandName}`.replace(/[*?:/\\\[\]]/g, '').trim();
                if (sheetTitle.length > 30) sheetTitle = sheetTitle.substring(0, 30);
                const ws = workbook.addWorksheet(sheetTitle);

                // Set column widths
                // Col: 1=No, 2=Estate, 3=Lokasi, 4=Unit, 5=TipeFilter, 6=JmlUnitMC, 7=Pemasangan, 7+N=StatusMC, 8+N=KontakPIC, 9+N=Note
                const colsConfig = [
                    { key: 'no', width: 6 },
                    { key: 'estate', width: 26 },
                    { key: 'lokasi', width: 20 },
                    { key: 'unit', width: 14 },
                    { key: 'tipe_filter', width: 18 },
                    { key: 'qty', width: 11 },
                    { key: 'pemasangan', width: 15 }
                ];
                for (let i = 0; i < numMaintCols; i++) {
                    colsConfig.push({ key: `m${i + 1}`, width: 16 });
                }
                colsConfig.push({ key: 'status_mc', width: 12 });
                colsConfig.push({ key: 'pic', width: 34 });
                colsConfig.push({ key: 'note', width: 30 });

                ws.columns = colsConfig;

                // Baris 1-4 untuk Logo Banner
                ws.addRow([]);
                ws.addRow([]);
                ws.addRow([]);
                ws.addRow([]);

                if (logoImageId !== null) {
                    ws.addImage(logoImageId, {
                        tl: { col: 0, row: 0 },
                        ext: { width: 230, height: 58 }
                    });
                }

                // Baris 5: Judul Laporan
                const titleRow = ws.addRow([`Rekapan Monitoring Maintenance MC ${grpName.toUpperCase()} ${islandName.toUpperCase()}`]);
                titleRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
                titleRow.height = 24;
                titleRow.alignment = { vertical: 'middle' };

                // Baris 6 & 7: Header Tabel 2 Baris
                // Col mapping (1-indexed):
                // 1=No, 2=Estate, 3=Lokasi, 4=Unit, 5=TipeFilter, 6=JmlUnitMC, 7=Pemasangan, 8..7+N=Maint, 8+N=StatusMC, 9+N=KontakPIC, 10+N=Note
                const hRow1Values = [
                    'No',
                    'Nama PT / Estate',
                    'Lokasi /\nPeruntukan',
                    'Unit',
                    'Tipe Filter',
                    'JML\nUNIT\nMC',
                    'Tanggal'
                ];
                // Isi sel kosong untuk kolom Tanggal (1 PEMASANGAN + numMaintCols)
                for (let i = 0; i < numMaintCols; i++) {
                    hRow1Values.push('');
                }
                hRow1Values.push('Status MC');
                hRow1Values.push('Kontak PIC');
                hRow1Values.push('Note');

                const headerRow1 = ws.addRow(hRow1Values);
                headerRow1.height = 26;

                const hRow2Values = [
                    '', '', '', '', '', '',
                    'PEMASANGAN'
                ];
                for (let i = 0; i < numMaintCols; i++) {
                    hRow2Values.push(getMaintColName(i));
                }
                hRow2Values.push('', '', '');

                const headerRow2 = ws.addRow(hRow2Values);
                headerRow2.height = 28;

                // Merge Cell Header
                ws.mergeCells(6, 1, 7, 1);  // No
                ws.mergeCells(6, 2, 7, 2);  // Nama PT / Estate
                ws.mergeCells(6, 3, 7, 3);  // Lokasi / Peruntukan
                ws.mergeCells(6, 4, 7, 4);  // Unit
                ws.mergeCells(6, 5, 7, 5);  // Tipe Filter
                ws.mergeCells(6, 6, 7, 6);  // JML UNIT MC
                ws.mergeCells(6, 7, 6, 7 + numMaintCols); // Tanggal (span: PEMASANGAN + all maint cols)
                ws.mergeCells(6, 8 + numMaintCols, 7, 8 + numMaintCols); // Status MC
                ws.mergeCells(6, 9 + numMaintCols, 7, 9 + numMaintCols); // Kontak PIC
                ws.mergeCells(6, 10 + numMaintCols, 7, 10 + numMaintCols); // Note

                // Style Baris Header (Kuning, Bold, Center, Border)
                for (let r = 6; r <= 7; r++) {
                    const row = ws.getRow(r);
                    for (let c = 1; c <= totalCols; c++) {
                        const cell = row.getCell(c);
                        cell.fill = yellowHeaderFill;
                        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF000000' } };
                        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        cell.border = borderThin;
                    }
                }

                // Baris Data per Provinsi
                let globalIndex = 1;
                for (const [provCode, tankList] of Object.entries(provinces)) {
                    // Subheader Provinsi (Baris Peach)
                    const subheaderRow = ws.addRow([provCode]);
                    subheaderRow.height = 20;
                    const subheaderRowIdx = subheaderRow.number;
                    ws.mergeCells(subheaderRowIdx, 1, subheaderRowIdx, totalCols);

                    for (let c = 1; c <= totalCols; c++) {
                        const cell = subheaderRow.getCell(c);
                        cell.fill = peachSubheaderFill;
                        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };
                        cell.border = borderThin;
                    }
                    subheaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

                    // Baris Data Unit
                    for (const tank of tankList) {
                        const history = historyByTank[tank.id] || [];

                        // Pemasangan
                        const installDateFormatted = formatExcelDate(tank.install_date);

                        // Tanggal Maintenance Dinamis
                        const slots = Array.from({ length: numMaintCols }, () => ({
                            text: '',
                            color: 'FF000000',
                            bold: false
                        }));

                        // Masukkan riwayat servis yang sudah selesai (Hitam)
                        history.forEach((h, hIdx) => {
                            if (hIdx < numMaintCols) {
                                slots[hIdx].text = formatExcelDate(h.service_date);
                                slots[hIdx].color = 'FF000000'; // Selesai = Hitam
                                slots[hIdx].bold = false;
                            }
                        });

                        // Tentukan slot servis berikutnya (next_maintenance)
                        const nextSlotIdx = history.length;
                        if (nextSlotIdx < numMaintCols && tank.next_maintenance) {
                            slots[nextSlotIdx].text = formatExcelDate(tank.next_maintenance);
                            // Jika jatuh tempo -> Merah, jika akan datang -> Biru
                            if (tank.computed_status === 'JATUH TEMPO' || (tank.days_left !== null && tank.days_left <= 0)) {
                                slots[nextSlotIdx].color = 'FFFF0000'; // Merah (Jatuh tempo/lewat)
                                slots[nextSlotIdx].bold = true;
                            } else {
                                slots[nextSlotIdx].color = 'FF0070C0'; // Biru (Akan datang)
                                slots[nextSlotIdx].bold = true;
                            }
                        }

                        // Format Kontak PIC: Ambil dari pic_manager atau pic_gudang + nomor HP (sesuai tampilan web)
                        const rawPic = (tank.pic_manager || tank.pic_gudang || '').trim();
                        const phone = (tank.phone_number || '').trim();
                        let picText = '';
                        if (rawPic && phone && !rawPic.includes(phone)) {
                            picText = `${rawPic}\n${phone}`;
                        } else if (rawPic) {
                            picText = rawPic;
                        } else if (phone) {
                            picText = phone;
                        }

                        // Lokasi / Peruntukan
                        const lokasiText = tank.location_type || tank.lokasi || '';

                        // Tipe Filter (dari kolom equipment)
                        const tipeFilter = tank.equipment || '';

                        // Status MC
                        const statusMc = tank.status_mc || (tank.install_date ? 'Aktif' : 'Belum');

                        // Col: 1=No, 2=Estate, 3=Lokasi, 4=Unit, 5=TipeFilter, 6=JmlUnitMC, 7=Pemasangan, 8..7+N=Maint, 8+N=Status, 9+N=KontakPIC, 10+N=Note
                        const rowValues = [
                            globalIndex++,
                            (tank.estate || '').toUpperCase(),
                            lokasiText,
                            tank.unit_name || tank.equipment || 'MDF250-1',
                            tipeFilter,
                            1,
                            installDateFormatted
                        ];

                        for (let i = 0; i < numMaintCols; i++) {
                            rowValues.push(slots[i].text);
                        }

                        rowValues.push(statusMc);
                        rowValues.push(picText);
                        rowValues.push(tank.notes || '');

                        const dataRow = ws.addRow(rowValues);
                        // Hitung tinggi baris secara dinamis berdasarkan jumlah baris teks (\n)
                        let maxLines = 1;
                        rowValues.forEach(val => {
                            if (val && typeof val === 'string') {
                                const lines = val.split('\n').length;
                                if (lines > maxLines) maxLines = lines;
                            }
                        });
                        dataRow.height = maxLines > 1 ? (maxLines * 18 + 6) : 22;

                        // Styling setiap cell data
                        // Col layout: 1=No, 2=Estate, 3=Lokasi, 4=Unit, 5=TipeFilter, 6=JmlUnitMC, 7=Pemasangan, 8..7+N=Maint, 8+N=Status, 9+N=KontakPIC, 10+N=Note
                        for (let c = 1; c <= totalCols; c++) {
                            const cell = dataRow.getCell(c);
                            cell.border = borderThin;
                            cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF000000' } };
                            cell.alignment = { vertical: 'middle' };

                            // Align center: No(1), Unit(4), JmlUnitMC(6), Pemasangan(7), Maint cols(8..7+N), Status(8+N)
                            if (c === 1 || c === 4 || c === 6 || (c >= 7 && c <= 8 + numMaintCols)) {
                                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                            } else {
                                // Estate(2), Lokasi(3), TipeFilter(5), KontakPIC(9+N), Note(10+N) -> left aligned
                                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 0.5 };
                            }

                            // Terapkan warna khusus untuk tanggal maintenance (col 8 s/d 7+N)
                            if (c >= 8 && c <= 7 + numMaintCols) {
                                const slotIdx = c - 8;
                                if (slots[slotIdx]) {
                                    cell.font = {
                                        name: 'Arial',
                                        size: 9.5,
                                        bold: slots[slotIdx].bold,
                                        color: { argb: slots[slotIdx].color }
                                    };
                                }
                            }
                        }
                    }
                }

                // Baris Kosong Pemisah
                ws.addRow([]);

                // Legend & Catatan di Bagian Bawah
                const noteRow = ws.addRow(['Note : Tidak menutup kemungkinan penggantian Element Filter tidak sesuai jadwal, apabila flow melambat / filter sudah tersumbat']);
                noteRow.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF000000' } };

                const leg1 = ws.addRow(['■', ': Tanggal sudah penggantian element filter']);
                leg1.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
                leg1.getCell(2).font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF000000' } };

                const leg2 = ws.addRow(['■', ': Tanggal waktu akan penggantian element filter']);
                leg2.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0070C0' } }; // Biru
                leg2.getCell(2).font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF0070C0' } };

                const leg3 = ws.addRow(['■', ': Tanggal yang belum update penggantian element filter']);
                leg3.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFF0000' } }; // Merah
                leg3.getCell(2).font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFFF0000' } };

                // Merge baris catatan legend agar rapi memanjang
                ws.mergeCells(noteRow.number, 1, noteRow.number, totalCols);

                // Auto-fit seluruh kolom agar melebar otomatis sesuai panjang teks (bebas terpotong)
                for (let c = 1; c <= totalCols; c++) {
                    const col = ws.getColumn(c);

                    // Kolom No (1) selalu ramping dan pas
                    if (c === 1) {
                        col.width = 6;
                        continue;
                    }

                    let maxContentLen = 0;

                    ws.eachRow({ includeEmpty: false }, (row) => {
                        // Hanya hitung baris header (6 & 7) dan baris data unit (>= 9)
                        if (row.number === 6 || row.number === 7 || row.number >= 9) {
                            const firstVal = String(row.getCell(1).value || '');
                            // Lewati jika ini baris legend di bawah
                            if (firstVal.startsWith('Note') || firstVal.startsWith('■')) {
                                return;
                            }
                            // Lewati baris subheader provinsi yang di-merge
                            if (row.number >= 8 && row.getCell(1).value && row.getCell(2).value === undefined) {
                                return;
                            }

                            const cell = row.getCell(c);
                            const val = cell.value ? String(cell.value) : '';
                            if (val) {
                                val.split('\n').forEach(line => {
                                    const len = line.trim().length;
                                    if (len > maxContentLen) maxContentLen = len;
                                });
                            }
                        }
                    });

                    // Tentukan lebar batas minimal berdasarkan jenis kolom
                    let minW = 12;
                    if (c === 2) minW = 20; // Estate
                    else if (c === 3) minW = 16; // Lokasi
                    else if (c === 4) minW = 22; // Unit
                    else if (c === 5) minW = 18; // Tipe Filter
                    else if (c === 6) minW = 11; // Jml Unit
                    else if (c >= 7 && c <= 7 + numMaintCols) minW = 16; // Tgl Pemasangan & Maintenance
                    else if (c === 8 + numMaintCols) minW = 12; // Status MC
                    else if (c === 9 + numMaintCols) minW = 28; // Kontak PIC (lega untuk nama + no hp)
                    else if (c === 10 + numMaintCols) minW = 22; // Note

                    col.width = Math.max(minW, maxContentLen + 4);
                }
            }
        }

        // 6. Buat buffer file Excel
        const buffer = await workbook.xlsx.writeBuffer();
        const cleanGroupName = (filterGroup && filterGroup !== 'ALL') ? filterGroup.replace(/\s+/g, '_') : 'SEMUA_GROUP';
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `Monitoring_MicroClean_${cleanGroupName}_${dateStr}.xlsx`;

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (err) {
        console.error('[Export Excel Error]', err);
        return new Response(JSON.stringify({ error: 'Gagal membuat file Excel', detail: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
