/**
 * src/lib/utils/regionHelper.js
 * Kamus pemetaan lengkap seluruh 38 Provinsi & Wilayah Utama (Pulau) di Indonesia.
 * Digunakan untuk pengelompokan laporan monitoring, form input tangki, dan export Excel.
 */

export const ISLAND_PROVINCES = [
    {
        island: 'Kalimantan',
        provinces: [
            { code: 'KALTIM', name: 'Kalimantan Timur (Kaltim)' },
            { code: 'KALTENG', name: 'Kalimantan Tengah (Kalteng)' },
            { code: 'KALBAR', name: 'Kalimantan Barat (Kalbar)' },
            { code: 'KALSEL', name: 'Kalimantan Selatan (Kalsel)' },
            { code: 'KALTARA', name: 'Kalimantan Utara (Kaltara / Kalut)' }
        ]
    },
    {
        island: 'Sumatra',
        provinces: [
            { code: 'SUMUT', name: 'Sumatera Utara (Sumut)' },
            { code: 'SUMSEL', name: 'Sumatera Selatan (Sumsel)' },
            { code: 'SUMBAR', name: 'Sumatera Barat (Sumbar)' },
            { code: 'RIAU', name: 'Riau' },
            { code: 'KEPRI', name: 'Kepulauan Riau (Kepri)' },
            { code: 'JAMBI', name: 'Jambi' },
            { code: 'ACEH', name: 'Aceh' },
            { code: 'LAMPUNG', name: 'Lampung' },
            { code: 'BENGKULU', name: 'Bengkulu' },
            { code: 'BABEL', name: 'Kep. Bangka Belitung (Babel)' }
        ]
    },
    {
        island: 'Jawa',
        provinces: [
            { code: 'JABAR', name: 'Jawa Barat (Jabar)' },
            { code: 'JATENG', name: 'Jawa Tengah (Jateng)' },
            { code: 'JATIM', name: 'Jawa Timur (Jatim)' },
            { code: 'BANTEN', name: 'Banten' },
            { code: 'DKI', name: 'DKI Jakarta' },
            { code: 'DIY', name: 'DI Yogyakarta' }
        ]
    },
    {
        island: 'Sulawesi',
        provinces: [
            { code: 'SULSEL', name: 'Sulawesi Selatan (Sulsel)' },
            { code: 'SULTENG', name: 'Sulawesi Tengah (Sulteng)' },
            { code: 'SULTRA', name: 'Sulawesi Tenggara (Sultra)' },
            { code: 'SULUT', name: 'Sulawesi Utara (Sulut)' },
            { code: 'GORONTALO', name: 'Gorontalo' },
            { code: 'SULBAR', name: 'Sulawesi Barat (Sulbar)' }
        ]
    },
    {
        island: 'Bali & Nusa Tenggara',
        provinces: [
            { code: 'BALI', name: 'Bali' },
            { code: 'NTB', name: 'Nusa Tenggara Barat (NTB)' },
            { code: 'NTT', name: 'Nusa Tenggara Timur (NTT)' }
        ]
    },
    {
        island: 'Maluku',
        provinces: [
            { code: 'MALUKU', name: 'Maluku' },
            { code: 'MALUT', name: 'Maluku Utara (Malut)' }
        ]
    },
    {
        island: 'Papua',
        provinces: [
            { code: 'PAPUA', name: 'Papua' },
            { code: 'PAPUA BARAT', name: 'Papua Barat' },
            { code: 'PAPUA SELATAN', name: 'Papua Selatan' },
            { code: 'PAPUA TENGAH', name: 'Papua Tengah' },
            { code: 'PAPUA PEGUNUNGAN', name: 'Papua Pegunungan' },
            { code: 'PAPUA BARAT DAYA', name: 'Papua Barat Daya' }
        ]
    }
];

/**
 * Deteksi Pulau / Wilayah Utama dari teks region/provinsi
 * @param {string} regionStr 
 * @returns {string} Nama Pulau (misal: 'Kalimantan', 'Sumatra', 'Jawa', dll.)
 */
export function getIslandFromRegion(regionStr) {
    if (!regionStr) return 'Lainnya';
    const s = regionStr.trim().toLowerCase();

    // Kalimantan
    if (
        s.includes('kal') ||
        s.includes('kaltim') ||
        s.includes('kalteng') ||
        s.includes('kalbar') ||
        s.includes('kalsel') ||
        s.includes('kaltara') ||
        s.includes('kaluta') ||
        s.includes('kalut') ||
        s.includes('borneo')
    ) {
        return 'Kalimantan';
    }

    // Sumatra
    if (
        s.includes('sum') ||
        s.includes('sumut') ||
        s.includes('sumsel') ||
        s.includes('sumbar') ||
        s.includes('sumtim') ||
        s.includes('riau') ||
        s.includes('kepri') ||
        s.includes('jambi') ||
        s.includes('aceh') ||
        s.includes('lampung') ||
        s.includes('bengkulu') ||
        s.includes('babel') ||
        s.includes('bangka')
    ) {
        return 'Sumatra';
    }

    // Jawa
    if (
        s.includes('jaw') ||
        s.includes('jabar') ||
        s.includes('jateng') ||
        s.includes('jatim') ||
        s.includes('banten') ||
        s.includes('dki') ||
        s.includes('jakarta') ||
        s.includes('diy') ||
        s.includes('yogya')
    ) {
        return 'Jawa';
    }

    // Sulawesi
    if (
        s.includes('sul') ||
        s.includes('sulsel') ||
        s.includes('sulteng') ||
        s.includes('sultra') ||
        s.includes('sulut') ||
        s.includes('sulbar') ||
        s.includes('gorontalo') ||
        s.includes('celebes')
    ) {
        return 'Sulawesi';
    }

    // Bali & Nusa Tenggara
    if (s.includes('bali') || s.includes('ntb') || s.includes('ntt') || s.includes('lombok') || s.includes('sumba') || s.includes('flores')) {
        return 'Bali & Nusa Tenggara';
    }

    // Maluku
    if (s.includes('maluku') || s.includes('malut') || s.includes('ambon') || s.includes('ternate')) {
        return 'Maluku';
    }

    // Papua
    if (s.includes('papua') || s.includes('irian') || s.includes('sorong') || s.includes('jayapura') || s.includes('merauke')) {
        return 'Papua';
    }

    return regionStr.toUpperCase();
}

/**
 * Normalisasi kode sub-wilayah / provinsi (misal: "kaltim" / "Kalimantan Timur" -> "KALTIM")
 * @param {string} regionStr 
 * @returns {string}
 */
export function normalizeProvinceCode(regionStr) {
    if (!regionStr) return 'UMUM';
    const s = regionStr.trim().toUpperCase();

    // ── KALIMANTAN ──
    if (s.includes('KALTIM') || (s.includes('TIMUR') && s.includes('KAL'))) return 'KALTIM';
    if (s.includes('KALTENG') || (s.includes('TENGAH') && s.includes('KAL'))) return 'KALTENG';
    if (s.includes('KALBAR') || (s.includes('BARAT') && s.includes('KAL'))) return 'KALBAR';
    if (s.includes('KALSEL') || (s.includes('SELATAN') && s.includes('KAL'))) return 'KALSEL';
    if (s.includes('KALTARA') || s.includes('KALUT') || (s.includes('UTARA') && s.includes('KAL'))) return 'KALTARA';

    // ── SUMATRA ──
    if (s.includes('SUMUT') || (s.includes('UTARA') && s.includes('SUM'))) return 'SUMUT';
    if (s.includes('SUMSEL') || (s.includes('SELATAN') && s.includes('SUM'))) return 'SUMSEL';
    if (s.includes('SUMBAR') || (s.includes('BARAT') && s.includes('SUM'))) return 'SUMBAR';
    if (s.includes('KEPRI') || (s.includes('KEP') && s.includes('RIAU'))) return 'KEPRI';
    if (s.includes('RIAU')) return 'RIAU';
    if (s.includes('JAMBI')) return 'JAMBI';
    if (s.includes('ACEH')) return 'ACEH';
    if (s.includes('LAMPUNG')) return 'LAMPUNG';
    if (s.includes('BENGKULU')) return 'BENGKULU';
    if (s.includes('BABEL') || s.includes('BANGKA') || s.includes('BELITUNG')) return 'BABEL';

    // ── JAWA ──
    if (s.includes('JABAR') || (s.includes('BARAT') && s.includes('JAW'))) return 'JABAR';
    if (s.includes('JATENG') || (s.includes('TENGAH') && s.includes('JAW'))) return 'JATENG';
    if (s.includes('JATIM') || (s.includes('TIMUR') && s.includes('JAW'))) return 'JATIM';
    if (s.includes('BANTEN')) return 'BANTEN';
    if (s.includes('DKI') || s.includes('JAKARTA')) return 'DKI';
    if (s.includes('DIY') || s.includes('YOGYA')) return 'DIY';

    // ── SULAWESI ──
    if (s.includes('SULSEL') || (s.includes('SELATAN') && s.includes('SUL'))) return 'SULSEL';
    if (s.includes('SULTENG') || (s.includes('TENGAH') && s.includes('SUL'))) return 'SULTENG';
    if (s.includes('SULTRA') || (s.includes('TENGGARA') && s.includes('SUL'))) return 'SULTRA';
    if (s.includes('SULUT') || (s.includes('UTARA') && s.includes('SUL'))) return 'SULUT';
    if (s.includes('SULBAR') || (s.includes('BARAT') && s.includes('SUL'))) return 'SULBAR';
    if (s.includes('GORONTALO')) return 'GORONTALO';

    // ── BALI & NUSA TENGGARA ──
    if (s.includes('BALI')) return 'BALI';
    if (s.includes('NTB') || s.includes('LOMBOK')) return 'NTB';
    if (s.includes('NTT') || s.includes('FLORES') || s.includes('SUMBA')) return 'NTT';

    // ── MALUKU ──
    if (s.includes('MALUT') || (s.includes('UTARA') && s.includes('MALUKU'))) return 'MALUT';
    if (s.includes('MALUKU') || s.includes('AMBON')) return 'MALUKU';

    // ── PAPUA ──
    if (s.includes('DAYA') && s.includes('PAPUA')) return 'PAPUA BARAT DAYA';
    if (s.includes('BARAT') && s.includes('PAPUA')) return 'PAPUA BARAT';
    if (s.includes('SELATAN') && s.includes('PAPUA')) return 'PAPUA SELATAN';
    if (s.includes('TENGAH') && s.includes('PAPUA')) return 'PAPUA TENGAH';
    if (s.includes('PEGUNUNGAN') && s.includes('PAPUA')) return 'PAPUA PEGUNUNGAN';
    if (s.includes('PAPUA') || s.includes('IRIAN')) return 'PAPUA';

    // Jika sudah kode singkatan atau nama khusus lainnya, kembalikan format uppercase
    return s;
}
