/**
 * exportUtils.js
 * Utility untuk Export ke Excel (.xlsx) dan PDF
 * Mengikuti format gaya Excel asli:
 *   "Rekapan Monitoring Maintenance MicroClean Diesel Filter"
 *   Header: No | Nama PT / Estate | Wilayah | Nama/Tipe Unit | Equipment | Tgl Pemasangan
 *           Maintenance Ke-1 ... Ke-N | Status MC | PIC Manager | PIC Gudang | No HP | Catatan
 */

// ═══════════════════════════════════════════════════════════
//  EXCEL EXPORT (menggunakan library SheetJS / xlsx)
// ═══════════════════════════════════════════════════════════

export async function exportToExcel(records, filterLabel = '') {
    const XLSX = await import('xlsx');

    // Tentukan max jumlah kolom maintenance berdasarkan data aktual
    // (kita taruh dummy 4 kolom dulu, nanti tiap record punya maintenance_count)
    // Karena data dari store tidak punya detail history, kita pakai last_maintenance saja
    // dan kolom-kolom standard

    const title = 'Rekapan Monitoring Maintenance MicroClean Diesel Filter';
    const subtitle = `PT. Anugerah Rezeki Teknindo${filterLabel ? ' — ' + filterLabel : ''}`;
    const printDate = `Dicetak: ${new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })}`;

    // ── Group records by group name (mirip sheet Excel asli) ──
    const grouped = {};
    for (const r of records) {
        const grp = r.group || 'Lainnya';
        if (!grouped[grp]) grouped[grp] = [];
        grouped[grp].push(r);
    }

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Semua Data (Rekapan Lengkap) ──
    const wsData = buildRekapSheet(XLSX, records, title, subtitle, printDate);
    XLSX.utils.book_append_sheet(wb, wsData, 'Rekapan Monitoring');

    // ── Sheet per Group (mirip Excel asli punya sheet per wilayah/grup) ──
    for (const [grpName, grpRecords] of Object.entries(grouped)) {
        const wsGrp = buildRekapSheet(XLSX, grpRecords, title, grpName, printDate, grpName);
        // Potong nama sheet max 31 karakter (batas Excel)
        const sheetName = grpName.length > 28 ? grpName.substring(0, 28) + '...' : grpName;
        XLSX.utils.book_append_sheet(wb, wsGrp, sheetName);
    }

    // ── Download ──
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Monitoring_MicroClean_${dateStr}.xlsx`;
    XLSX.writeFile(wb, filename);
}

function buildRekapSheet(XLSX, records, title, subtitle, printDate, groupFilter = '') {
    const rows = [];

    // ── Header judul (baris 1–3) ──
    rows.push([title]);
    rows.push([subtitle]);
    rows.push([printDate]);
    rows.push([]); // baris kosong

    // ── Header kolom (baris 5) ──
    rows.push([
        'No',
        'Group / PT',
        'Nama PT / Estate',
        'Wilayah',
        'Nama / Tipe Unit',
        'Equipment Filter',
        'Status MC',
        'Tanggal Pemasangan',
        'Maintenance Terakhir',
        'Maintenance Berikutnya',
        'Interval (Bulan)',
        'Status Sistem',
        'Sisa Hari',
        'PIC Manager',
        'PIC Gudang',
        'No. HP / WA',
        'Catatan / Note',
    ]);

    // ── Baris data ──
    records.forEach((r, idx) => {
        rows.push([
            idx + 1,
            r.group || '',
            r.estate || '',
            r.region || '',
            r.unit_name || r.tank_capacity || 'Tangki Timbun Solar',
            r.equipment || '',
            r.status_mc || 'Aktif',
            r.install_date || '',
            r.last_maintenance || '',
            r.next_maintenance || '',
            r.interval_months || 3,
            r.computed_status || '',
            r.days_left != null ? r.days_left : '',
            r.pic_manager || '',
            r.pic_gudang || '',
            r.phone_number || '',
            r.notes || '',
        ]);
    });

    // ── Baris total ──
    rows.push([]);
    rows.push([`Total Unit: ${records.length}`]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // ── Styling lebar kolom ──
    ws['!cols'] = [
        { wch: 5  },  // No
        { wch: 22 },  // Group
        { wch: 22 },  // Estate
        { wch: 16 },  // Wilayah
        { wch: 22 },  // Nama Unit
        { wch: 16 },  // Equipment
        { wch: 12 },  // Status MC
        { wch: 18 },  // Tgl Pasang
        { wch: 18 },  // Last Maint
        { wch: 20 },  // Next Maint
        { wch: 8  },  // Interval
        { wch: 14 },  // Status Sistem
        { wch: 8  },  // Sisa Hari
        { wch: 28 },  // PIC Manager
        { wch: 28 },  // PIC Gudang
        { wch: 18 },  // HP
        { wch: 35 },  // Catatan
    ];

    // Merge judul di baris pertama (A1:Q1)
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 16 } },
    ];

    return ws;
}

// ═══════════════════════════════════════════════════════════
//  PDF EXPORT (menggunakan jsPDF + AutoTable)
// ═══════════════════════════════════════════════════════════

export async function exportToPDF(records, filterLabel = '') {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const title = 'Rekapan Monitoring Maintenance MicroClean Diesel Filter';
    const subtitle = `PT. Anugerah Rezeki Teknindo${filterLabel ? ' — ' + filterLabel : ''}`;
    const printDate = `Dicetak: ${new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })}`;

    const pageW = doc.internal.pageSize.getWidth();

    // ── Cover / Header ──
    // Background bar kuning (warna brand MicroClean)
    doc.setFillColor(30, 32, 50);
    doc.rect(0, 0, pageW, 28, 'F');

    // Teks judul
    doc.setTextColor(250, 210, 50);   // kuning
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageW / 2, 10, { align: 'center' });

    doc.setTextColor(200, 220, 255);  // biru muda
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageW / 2, 17, { align: 'center' });

    doc.setTextColor(160, 180, 210);
    doc.setFontSize(7.5);
    doc.text(printDate, pageW / 2, 23, { align: 'center' });

    // ── Ringkasan stat kecil ──
    const aman       = records.filter(r => r.computed_status === 'AMAN').length;
    const notice     = records.filter(r => r.computed_status === 'NOTICE').length;
    const jatuhTempo = records.filter(r => r.computed_status === 'JATUH TEMPO').length;
    const nonAktif   = records.filter(r => r.computed_status === 'NON-AKTIF').length;

    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    const statY = 32;
    const statBoxes = [
        { label: 'Total Unit',   value: records.length, color: [30, 100, 200]  },
        { label: 'Aman',         value: aman,           color: [20, 170, 100]  },
        { label: 'Notice',       value: notice,         color: [220, 150, 20]  },
        { label: 'Jatuh Tempo',  value: jatuhTempo,     color: [200, 50, 50]   },
        { label: 'Non-Aktif',    value: nonAktif,       color: [120, 120, 140] },
    ];
    const boxW = 36, boxH = 12, startX = (pageW - statBoxes.length * boxW) / 2;
    statBoxes.forEach((box, i) => {
        const x = startX + i * boxW;
        doc.setFillColor(...box.color);
        doc.roundedRect(x, statY, boxW - 2, boxH, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(String(box.value), x + (boxW - 2) / 2, statY + 6.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text(box.label, x + (boxW - 2) / 2, statY + 10.5, { align: 'center' });
    });

    // ── Tabel data ──
    const tableHead = [[
        'No', 'Group / PT', 'Nama PT / Estate', 'Wilayah',
        'Nama / Tipe Unit', 'Equipment', 'Status MC',
        'Tgl Pasang', 'Last Servis', 'Next Servis',
        'Int.', 'Status', 'Sisa\nHari',
        'PIC Manager', 'PIC Gudang', 'No. HP'
    ]];

    const tableBody = records.map((r, idx) => {
        const statusLabel = r.computed_status === 'JATUH TEMPO' ? `Lewat ${Math.abs(r.days_left)}h`
            : r.computed_status === 'NOTICE'     ? `Notice ${r.days_left}h`
            : r.computed_status === 'NON-AKTIF'  ? 'Non-Aktif'
            : `Aman ${r.days_left}h`;

        return [
            idx + 1,
            r.group || '',
            r.estate || '',
            r.region || '',
            r.unit_name || r.tank_capacity || 'Tangki Timbun',
            r.equipment || '',
            r.status_mc || 'Aktif',
            r.install_date || '',
            r.last_maintenance || '',
            r.next_maintenance || '',
            r.interval_months || 3,
            statusLabel,
            r.days_left != null ? r.days_left : '',
            r.pic_manager ? r.pic_manager.substring(0, 25) : '',
            r.pic_gudang  ? r.pic_gudang.substring(0, 25)  : '',
            r.phone_number || '',
        ];
    });

    doc.autoTable({
        head: tableHead,
        body: tableBody,
        startY: statY + boxH + 4,
        theme: 'grid',
        styles: {
            fontSize: 7,
            cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
            valign: 'middle',
            overflow: 'linebreak',
            lineColor: [200, 210, 230],
            lineWidth: 0.2,
        },
        headStyles: {
            fillColor: [20, 28, 48],
            textColor: [150, 210, 255],
            fontStyle: 'bold',
            fontSize: 6.5,
            halign: 'center',
        },
        columnStyles: {
            0:  { halign: 'center', cellWidth: 8  },   // No
            1:  { cellWidth: 22 },                      // Group
            2:  { cellWidth: 22 },                      // Estate
            3:  { cellWidth: 16 },                      // Wilayah
            4:  { cellWidth: 22 },                      // Nama Unit
            5:  { cellWidth: 16 },                      // Equipment
            6:  { cellWidth: 14, halign: 'center' },    // Status MC
            7:  { cellWidth: 18, halign: 'center' },    // Tgl Pasang
            8:  { cellWidth: 18, halign: 'center' },    // Last Servis
            9:  { cellWidth: 18, halign: 'center' },    // Next Servis
            10: { cellWidth: 8,  halign: 'center' },    // Interval
            11: { cellWidth: 16, halign: 'center' },    // Status
            12: { cellWidth: 10, halign: 'center' },    // Sisa Hari
            13: { cellWidth: 28 },                      // PIC Manager
            14: { cellWidth: 28 },                      // PIC Gudang
            15: { cellWidth: 20 },                      // HP
        },
        // Warna baris bergantian
        alternateRowStyles: { fillColor: [245, 248, 255] },
        // Warna per status
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 11) {
                const val = String(data.cell.raw || '');
                if (val.startsWith('Lewat'))        { data.cell.styles.textColor = [200, 40,  40];  data.cell.styles.fontStyle = 'bold'; }
                else if (val.startsWith('Notice'))  { data.cell.styles.textColor = [200, 130, 20];  data.cell.styles.fontStyle = 'bold'; }
                else if (val.startsWith('Aman'))    { data.cell.styles.textColor = [20,  160, 80];                                       }
                else if (val.startsWith('Non'))     { data.cell.styles.textColor = [120, 120, 140];                                      }
            }
        },
        // Footer tiap halaman
        didDrawPage(data) {
            const pageCount = doc.internal.getNumberOfPages();
            const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
            doc.setFontSize(6.5);
            doc.setTextColor(160, 170, 190);
            doc.text(
                `MicroClean Diesel Filter — PT. Anugerah Rezeki Teknindo  |  Halaman ${currentPage} dari ${pageCount}  |  ${printDate}`,
                pageW / 2,
                doc.internal.pageSize.getHeight() - 5,
                { align: 'center' }
            );
        },
        margin: { top: 5, right: 8, bottom: 12, left: 8 },
    });

    // ── Download ──
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Monitoring_MicroClean_${dateStr}.pdf`;
    doc.save(filename);
}
