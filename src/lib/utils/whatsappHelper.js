/**
 * src/lib/utils/whatsappHelper.js
 * Utility untuk parsing nomor kontak PIC dari teks (termasuk nomor di dalam kurung)
 * dan membangun tautan WhatsApp langsung (wa.me) dengan pesan template profesional.
 */

/**
 * Ekstrak nama dan nomor telepon dari record (misal: "Hendra (082149582789)")
 * @param {object} record
 * @returns {{ name: string, phone: string, rawPhone: string, hasPhone: boolean }}
 */
export function parsePicContact(record) {
    const rawPic = record?.pic_manager || record?.pic_gudang || '';
    const directPhone = record?.phone_number || '';

    let name = '';
    let extractedPhone = '';

    // 1. Cek nomor di dalam tanda kurung: "(0821...)" atau "(+62...)"
    const bracketMatch = rawPic.match(/\(([^)]+)\)/);
    if (bracketMatch) {
        const inside = bracketMatch[1];
        const digits = inside.replace(/\D/g, '');
        if (digits.length >= 8) {
            extractedPhone = inside;
            // Ambil nama sebelum atau sesudah tanda kurung
            name = rawPic.replace(/\([^)]+\)/g, '').replace(/[-–:]/g, '').trim();
        }
    }

    // 2. Jika tidak ada di dalam kurung, cari pola nomor telepon di teks langsung (e.g. 08xx-xxxx-xxxx atau +62xxx)
    if (!extractedPhone) {
        const phoneRegex = /(?:\+?62|08)[0-9\s\-]{8,18}/;
        const match = rawPic.match(phoneRegex);
        if (match) {
            extractedPhone = match[0];
            name = rawPic.replace(match[0], '').replace(/[-–:]/g, '').trim();
        }
    }

    // 3. Fallback ke field directPhone jika ada
    if (!extractedPhone && directPhone) {
        extractedPhone = directPhone;
    }

    // 4. Jika nama masih kosong, bersihkan rawPic
    if (!name) {
        name = rawPic.replace(/\([^)]+\)/g, '').trim() || 'Bapak/Ibu';
    }

    // Format nomor HP ke format standar internasional WhatsApp (diawali 62)
    let cleanPhone = extractedPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
        cleanPhone = '62' + cleanPhone;
    }

    const hasPhone = cleanPhone.length >= 9;

    return {
        name: name || 'Bapak/Ibu',
        phone: cleanPhone,
        rawPhone: extractedPhone,
        hasPhone
    };
}

/**
 * Bangun URL WhatsApp (wa.me) dengan pesan otomatis sesuai kondisi filter
 * @param {object} record 
 * @returns {string}
 */
export function buildWhatsAppUrl(record) {
    const contact = parsePicContact(record);
    const phone = contact.phone || '6282252221079';
    const picName = contact.name || 'Bapak/Ibu';
    const nextDate = record?.next_maintenance || 'waktu dekat';
    const estate = record?.estate || 'Unit Konsumen';
    const group = record?.group ? ` (${record.group})` : '';
    const unit = record?.unit_name || record?.tank_capacity || 'Unit Tangki Timbun Solar';
    const equipment = record?.equipment || 'MicroClean Filter';

    let statusNote = '';
    if (record?.computed_status === 'JATUH TEMPO') {
        const days = Math.abs(record.days_left || 0);
        statusNote = `\n🚨 *Status:* Jadwal maintenance telah *LEWAT JATUH TEMPO (${days} hari lalu)*.`;
    } else if (record?.computed_status === 'NOTICE') {
        const days = record.days_left || 0;
        statusNote = `\n⚠️ *Status:* Sisa waktu menuju jatuh tempo maintenance *tinggal ${days} hari lagi*.`;
    } else if (record?.computed_status === 'AMAN') {
        const days = record.days_left || 0;
        statusNote = `\n✅ *Status:* Kondisi unit saat ini aman (sisa ${days} hari).`;
    }

    const message = 
`Halo ${picName},

Kami dari tim teknis *PT. Anugerah Rezeki Teknindo (MicroClean Diesel Filter)* ingin mengonfirmasikan jadwal maintenance filter:

📋 *Unit:* ${unit}
🏢 *Kebun / PT:* ${estate}${group}
⚙️ *Equipment:* ${equipment}
📅 *Jadwal Servis:* ${nextDate}${statusNote}

Mohon konfirmasinya untuk koordinasi pengiriman elemen filter pengganti atau jadwal servis teknisi ke lokasi. Terima kasih! 🙏`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
