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
    try {
        const tankIds = records && Array.isArray(records) ? records.map(r => r.id) : [];
        const res = await fetch('/api/export/excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tankIds,
                filterLabel
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server returned status ${res.status}`);
        }

        const blob = await res.blob();
        const contentDisposition = res.headers.get('Content-Disposition');
        let filename = 'Monitoring_MicroClean.xlsx';
        if (contentDisposition && contentDisposition.includes('filename=')) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match && match[1]) filename = match[1];
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Gagal export Excel:', err);
        alert('Gagal mengunduh file Excel: ' + err.message);
    }
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
        'Tipe Lokasi',
        'Wilayah',
        'Nama / Tipe Unit',
        'Equipment Filter',
        'Status MC',
        'Tanggal Pemasangan',
        'Maintenance Terakhir',
        'Maintenance Berikutnya',
        'Interval (Hari)',
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
            r.location_type || 'Kebun',
            r.region || '',
            r.unit_name || r.tank_capacity || 'Tangki Timbun Solar',
            r.equipment || '',
            r.status_mc || 'Aktif',
            r.install_date || '',
            r.last_maintenance || '',
            r.next_maintenance || '',
            r.interval_months || 90,
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
        { wch: 14 },  // Tipe Lokasi
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
    try {
        const tankIds = records && Array.isArray(records) ? records.map(r => r.id) : [];
        const res = await fetch('/api/export/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tankIds,
                filterLabel
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server returned status ${res.status}`);
        }

        const blob = await res.blob();
        const contentDisposition = res.headers.get('Content-Disposition');
        let filename = 'Monitoring_MicroClean.pdf';
        if (contentDisposition && contentDisposition.includes('filename=')) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match && match[1]) filename = match[1];
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Gagal export PDF:', err);
        alert('Gagal mengunduh file PDF: ' + err.message);
    }
}
