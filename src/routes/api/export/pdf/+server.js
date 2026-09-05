/**
 * src/routes/api/export/pdf/+server.js
 * API endpoint untuk generate dan export file PDF resmi MicroClean (Format Landscape)
 * Mengikuti template yang sama dengan Excel:
 * - Orientasi A4 Landscape (cocok untuk print out)
 * - Logo banner MicroClean di pojok kiri atas
 * - Judul: Rekapan Monitoring Maintenance MC MicroClean Diesel Filter
 * - Header 2 baris warna kuning (#FFFF00), border tipis
 * - Subheader pemisah group / wilayah warna peach (#FCE4D6)
 * - Full 1 dokumen berkelanjutan (tidak dipisah sheet)
 * - Kolom maintenance dinamis sesuai data yang dicetak
 * - Teks tanggal: Hitam (sudah servis), Biru (akan datang), Merah (jatuh tempo)
 * - Kontak PIC terisi lengkap nama + no HP tanpa terpotong
 * - Legend catatan di bagian bawah
 */
import { query } from '$lib/server/db.js';
import { transformTank } from '$lib/server/statusHelper.js';
import { normalizeProvinceCode } from '$lib/utils/regionHelper.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// Format tanggal ke format DD-MMM-YY (misal: 11-Mar-26)
function formatPdfDate(dateStr) {
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

// Nama kolom maintenance bertingkat (Pertama, Kedua, ... dst.)
function getMaintColName(idx) {
    const ordinals = [
        'Pertama', 'Kedua', 'Ketiga', 'Keempat', 'Kelima',
        'Keenam', 'Ketujuh', 'Kedelapan', 'Kesembilan', 'Kesepuluh',
        'Ke-11', 'Ke-12', 'Ke-13', 'Ke-14', 'Ke-15'
    ];
    const name = idx < ordinals.length ? ordinals[idx] : `Ke-${idx + 1}`;
    return `Maintenance\n${name}`;
}

export async function POST({ request }) {
    try {
        const reqBody = await request.json().catch(() => ({}));
        const tankIds = reqBody.tankIds || null;
        const filterLabel = reqBody.filterLabel || '';

        // 1. Ambil data tangki dari database
        let tanks = [];
        if (tankIds && Array.isArray(tankIds) && tankIds.length > 0) {
            const placeholders = tankIds.map(() => '?').join(',');
            const rows = await query(
                `SELECT * FROM tanks WHERE id IN (${placeholders}) ORDER BY group_name, region, estate`,
                tankIds
            );
            tanks = rows.map(r => transformTank(r));
        } else {
            const rows = await query('SELECT * FROM tanks ORDER BY group_name, region, estate');
            tanks = rows.map(r => transformTank(r));
        }

        if (tanks.length === 0) {
            return new Response(JSON.stringify({ error: 'Tidak ada data tangki yang ditemukan untuk diexport' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Ambil seluruh riwayat maintenance untuk tangki-tangki ini
        const validTankIds = tanks.map(t => t.id);
        const maintPlaceholders = validTankIds.map(() => '?').join(',');
        const historyRows = await query(
            `SELECT * FROM maintenance_history WHERE tank_id IN (${maintPlaceholders}) ORDER BY service_date ASC, id ASC`,
            validTankIds
        );

        const historyByTank = {};
        for (const row of historyRows) {
            if (!historyByTank[row.tank_id]) {
                historyByTank[row.tank_id] = [];
            }
            historyByTank[row.tank_id].push(row);
        }

        // 3. Hitung jumlah kolom maintenance dinamis (tidak dipatok 5)
        let maxSlots = 0;
        for (const t of tanks) {
            const histLen = (historyByTank[t.id] || []).length;
            const reqSlots = histLen + (t.next_maintenance ? 1 : 0);
            if (reqSlots > maxSlots) {
                maxSlots = reqSlots;
            }
        }
        const numMaintCols = Math.max(1, maxSlots);
        const totalCols = 10 + numMaintCols;

        // 4. Kelompokkan tangki berdasarkan Group -> Wilayah / Provinsi
        const groupedData = {};
        for (const t of tanks) {
            const grp = t.group || t.group_name || 'CBI Group';
            const provCode = normalizeProvinceCode(t.region);

            if (!groupedData[grp]) groupedData[grp] = {};
            if (!groupedData[grp][provCode]) groupedData[grp][provCode] = [];
            groupedData[grp][provCode].push(t);
        }

        // 5. Inisialisasi jsPDF Landscape A4
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageW = doc.internal.pageSize.getWidth();
        const printDateStr = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Load Logo Banner
        const logoPath = path.join(process.cwd(), 'static', 'images', 'microclean_logo_banner.png');
        if (fs.existsSync(logoPath)) {
            const logoBuf = fs.readFileSync(logoPath);
            const logoBase64 = 'data:image/png;base64,' + logoBuf.toString('base64');
            doc.addImage(logoBase64, 'PNG', 10, 8, 48, 12);
        }

        // Judul Header Dokumen
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text('REKAPAN MONITORING MAINTENANCE MC MICROCLEAN DIESEL FILTER', 62, 13);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        const subTitleText = filterLabel ? `PT. Anugerah Rezeki Teknindo  ·  Filter: ${filterLabel}` : 'PT. Anugerah Rezeki Teknindo';
        doc.text(subTitleText, 62, 18);

        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text(`Dicetak: ${printDateStr}`, pageW - 10, 18, { align: 'right' });

        // 6. Susun Table Head (2 Baris Header Kuning)
        const maintHeaders = [];
        for (let i = 0; i < numMaintCols; i++) {
            maintHeaders.push({
                content: getMaintColName(i),
                styles: { halign: 'center', valign: 'middle' }
            });
        }

        const head = [
            [
                { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Nama PT / Estate', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Lokasi /\nPeruntukan', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Unit', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Tipe Filter', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'JML\nUNIT\nMC', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Tanggal', colSpan: 1 + numMaintCols, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Status MC', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Kontak PIC', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Note', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
            ],
            [
                { content: 'PEMASANGAN', styles: { halign: 'center', valign: 'middle' } },
                ...maintHeaders
            ]
        ];

        // 7. Susun Table Body (Per Group & Provinsi)
        const body = [];
        let globalIndex = 1;

        for (const [grpName, provinces] of Object.entries(groupedData)) {
            for (const [provCode, tankList] of Object.entries(provinces)) {
                // Subheader Section Baris Peach (#FCE4D6)
                body.push([
                    {
                        content: `${grpName.toUpperCase()} — ${provCode.toUpperCase()}`,
                        colSpan: totalCols,
                        styles: {
                            fillColor: [252, 228, 214],
                            textColor: [0, 0, 0],
                            fontStyle: 'bold',
                            halign: 'left',
                            fontSize: 7.5
                        }
                    }
                ]);

                // Baris Data Unit
                for (const tank of tankList) {
                    const history = historyByTank[tank.id] || [];
                    const installDateFormatted = formatPdfDate(tank.install_date);

                    // Slot maintenance
                    const slots = Array.from({ length: numMaintCols }, () => ({
                        text: '',
                        color: [0, 0, 0],
                        bold: false
                    }));

                    history.forEach((h, hIdx) => {
                        if (hIdx < numMaintCols) {
                            slots[hIdx].text = formatPdfDate(h.service_date);
                            slots[hIdx].color = [0, 0, 0]; // Hitam
                            slots[hIdx].bold = false;
                        }
                    });

                    const nextSlotIdx = history.length;
                    if (nextSlotIdx < numMaintCols && tank.next_maintenance) {
                        slots[nextSlotIdx].text = formatPdfDate(tank.next_maintenance);
                        if (tank.computed_status === 'JATUH TEMPO' || (tank.days_left !== null && tank.days_left <= 0)) {
                            slots[nextSlotIdx].color = [220, 30, 30]; // Merah
                            slots[nextSlotIdx].bold = true;
                        } else {
                            slots[nextSlotIdx].color = [0, 112, 192]; // Biru
                            slots[nextSlotIdx].bold = true;
                        }
                    }

                    // Format Kontak PIC
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

                    const rowCells = [
                        { content: String(globalIndex++), styles: { halign: 'center' } },
                        { content: (tank.estate || '').toUpperCase(), styles: { fontStyle: 'bold' } },
                        { content: tank.location_type || tank.lokasi || '' },
                        { content: tank.unit_name || tank.equipment || 'Tangki Timbun' },
                        { content: tank.equipment || '' },
                        { content: '1', styles: { halign: 'center' } },
                        { content: installDateFormatted, styles: { halign: 'center' } },
                        ...slots.map(s => ({
                            content: s.text,
                            styles: {
                                halign: 'center',
                                textColor: s.color,
                                fontStyle: s.bold ? 'bold' : 'normal'
                            }
                        })),
                        { content: tank.status_mc || 'AKTIF', styles: { halign: 'center', fontStyle: 'bold' } },
                        { content: picText },
                        { content: tank.notes || '' }
                    ];

                    body.push(rowCells);
                }
            }
        }

        // 8. Render Table dengan AutoTable
        autoTable(doc, {
            head,
            body,
            startY: 24,
            theme: 'grid',
            margin: { top: 24, right: 10, bottom: 18, left: 10 },
            headStyles: {
                fillColor: [255, 255, 0], // Bright Yellow
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.15,
                fontStyle: 'bold',
                fontSize: 6.8,
                halign: 'center',
                valign: 'middle'
            },
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.12,
                fontSize: 6.5,
                cellPadding: 1.5,
                valign: 'middle',
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 8 },  // No
                1: { cellWidth: 24 },                   // Estate
                2: { cellWidth: 18 },                   // Lokasi
                3: { cellWidth: 24 },                   // Unit
                4: { cellWidth: 20 },                   // Tipe Filter
                5: { halign: 'center', cellWidth: 11 }, // Qty
                6: { halign: 'center', cellWidth: 17 }, // Pemasangan
                // Maint cols auto width
                [7 + numMaintCols]: { halign: 'center', cellWidth: 15 }, // Status MC
                [8 + numMaintCols]: { cellWidth: 32 },                  // Kontak PIC
                [9 + numMaintCols]: { cellWidth: 26 }                   // Note
            },
            // Footer tiap halaman
            didDrawPage(data) {
                const totalPages = doc.internal.getNumberOfPages();
                const currPage = doc.internal.getCurrentPageInfo().pageNumber;

                doc.setFontSize(6.5);
                doc.setTextColor(120, 120, 120);
                doc.text(
                    `PT. Anugerah Rezeki Teknindo — MicroClean Diesel Filter  |  Halaman ${currPage} dari ${totalPages}  |  Dicetak: ${printDateStr}`,
                    pageW / 2,
                    doc.internal.pageSize.getHeight() - 5,
                    { align: 'center' }
                );
            }
        });

        // 9. Legend & Catatan di Bawah Tabel
        let finalY = doc.lastAutoTable.finalY + 4;
        if (finalY > 185) {
            doc.addPage();
            finalY = 15;
        }

        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(50, 50, 50);
        doc.text('Note : Tidak menutup kemungkinan penggantian Element Filter tidak sesuai jadwal, apabila flow melambat / filter sudah tersumbat', 10, finalY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        // Legend 1: Hitam
        doc.setTextColor(0, 0, 0);
        doc.text('■', 10, finalY + 4.5);
        doc.text(': Tanggal sudah penggantian element filter', 14, finalY + 4.5);

        // Legend 2: Biru
        doc.setTextColor(0, 112, 192);
        doc.text('■', 10, finalY + 8.5);
        doc.text(': Tanggal waktu akan penggantian element filter', 14, finalY + 8.5);

        // Legend 3: Merah
        doc.setTextColor(220, 30, 30);
        doc.text('■', 10, finalY + 12.5);
        doc.text(': Tanggal yang belum update penggantian element filter', 14, finalY + 12.5);

        // 10. Generate Buffer
        const pdfArrayBuffer = doc.output('arraybuffer');
        const buffer = Buffer.from(pdfArrayBuffer);
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `Monitoring_MicroClean_${dateStr}.pdf`;

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (err) {
        console.error('[Export PDF Error]', err);
        return new Response(JSON.stringify({ error: 'Gagal membuat file PDF', detail: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
