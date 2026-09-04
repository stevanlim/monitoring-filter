/**
 * src/lib/server/statusHelper.js
 * Helper untuk compute status filter & days_left di sisi server
 */

/**
 * Format Date ke string YYYY-MM-DD secara aman (mengikuti waktu lokal tanpa pergeseran UTC)
 * @param {Date|string} d
 * @returns {string|null}
 */
export function formatLocalDate(d) {
    if (!d) return null;
    if (typeof d === 'string') {
        const clean = d.split('T')[0].split(' ')[0].trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    }
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Dapatkan tanggal hari ini dalam format YYYY-MM-DD (waktu lokal)
 * @returns {string}
 */
export function getTodayLocal() {
    return formatLocalDate(new Date());
}

/**
 * Tambah bulan ke tanggal YYYY-MM-DD
 * @param {string} dateStr
 * @param {number} months
 * @returns {string}
 */
export function addMonthsToDate(dateStr, months = 3) {
    if (!dateStr) return getTodayLocal();
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const dt = new Date(year, month + parseInt(months), day);
        return formatLocalDate(dt);
    }
    const dt = new Date(dateStr);
    dt.setMonth(dt.getMonth() + parseInt(months));
    return formatLocalDate(dt);
}

/**
 * Hitung computed_status dan days_left dari tanggal next_maintenance
 * @param {object} rec - Row dari tabel tanks
 * @returns {object} rec dengan tambahan computed_status & days_left
 */
export function computeStatus(rec) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let status = 'AMAN';
    let daysLeft = null;

    const statusMcUpper = (rec.status_mc || '').toUpperCase();
    if (
        statusMcUpper.includes('TIDAK ADA') ||
        statusMcUpper.includes('TIDAK AKTIF') ||
        statusMcUpper.includes('PECAH') ||
        statusMcUpper.includes('NON')
    ) {
        status = 'NON-AKTIF';
    } else if (rec.next_maintenance) {
        const parts = rec.next_maintenance.split('T')[0].split('-');
        let nextDt;
        if (parts.length === 3) {
            nextDt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
            nextDt = new Date(rec.next_maintenance);
        }
        nextDt.setHours(0, 0, 0, 0);
        const diffTime = nextDt.getTime() - today.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
            status = 'JATUH TEMPO';
        } else if (daysLeft <= 30) {
            status = 'NOTICE';
        } else {
            status = 'AMAN';
        }
    }

    return {
        ...rec,
        computed_status: status,
        days_left: daysLeft
    };
}

/**
 * Transform raw MySQL row ke format yang dipakai frontend
 * @param {object} row
 */
export function transformTank(row) {
    let rawUnit = row.unit_name || row.tank_capacity || 'Tangki Timbun Solar';
    let unitName = rawUnit;
    if (rawUnit.toLowerCase().includes('ltr') || rawUnit === '-' || !rawUnit.trim()) {
        unitName = 'Tangki Timbun Solar';
    }

    return computeStatus({
        id:               row.id,
        group:            row.group_name,
        sheet:            row.sheet_name,
        region:           row.region,
        estate:           row.estate,
        unit_name:        unitName,
        tank_capacity:    unitName,
        sisa_solar:       row.sisa_solar || '-',
        equipment:        row.equipment,
        status_mc:        row.status_mc,
        install_date:     formatLocalDate(row.install_date),
        last_maintenance: formatLocalDate(row.last_maintenance),
        next_maintenance: formatLocalDate(row.next_maintenance),
        interval_months:  row.interval_months || 3,
        pic_manager:      row.pic_manager,
        pic_gudang:       row.pic_gudang,
        phone_number:     row.phone_number,
        notes:            row.notes,
        photos:           [],
        maintenance_history: []
    });
}
