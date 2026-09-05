/**
 * src/lib/stores/notificationStore.js
 * 
 * Store untuk sistem notifikasi in-app:
 * - Mendeteksi unit jatuh tempo / notice
 * - Mendeteksi stok filter habis / menipis
 * - Mendeteksi unit terlantar (>6 bulan tanpa servis)
 * - Menyediakan toast queue dan success feedback
 */
import { writable, derived, get } from 'svelte/store';
import { recordsStore, statsStore, filterStockStore, stockAlertStore } from './filterStore.js';

// ============================================================
// Notification Queue Store
// ============================================================
function createNotificationStore() {
    const { subscribe, set, update } = writable([]);

    let idCounter = 0;

    return {
        subscribe,

        /**
         * Tambah notifikasi baru ke queue
         * @param {'urgent'|'warning'|'success'|'info'} type
         * @param {string} title
         * @param {string} message
         * @param {object} options - { duration, action, actionLabel, actionHref, icon }
         */
        add(type, title, message, options = {}) {
            const id = ++idCounter;
            const notification = {
                id,
                type,
                title,
                message,
                icon: options.icon || getDefaultIcon(type),
                action: options.action || null,
                actionLabel: options.actionLabel || null,
                actionHref: options.actionHref || null,
                duration: options.duration || getDuration(type),
                createdAt: Date.now(),
                dismissed: false
            };

            update(list => {
                // Cegah duplikat berdasarkan title + message dalam 10 detik terakhir
                const isDuplicate = list.some(n =>
                    n.title === title &&
                    n.message === message &&
                    (Date.now() - n.createdAt) < 10000
                );
                if (isDuplicate) return list;

                return [...list, notification];
            });

            // Auto-dismiss setelah durasi
            if (notification.duration > 0) {
                setTimeout(() => {
                    this.dismiss(id);
                }, notification.duration);
            }

            return id;
        },

        /** Dismiss notifikasi tertentu */
        dismiss(id) {
            update(list => list.filter(n => n.id !== id));
        },

        /** Dismiss semua */
        dismissAll() {
            set([]);
        },

        /** Shortcut: Tambah notifikasi urgent */
        urgent(title, message, options = {}) {
            return this.add('urgent', title, message, options);
        },

        /** Shortcut: Tambah notifikasi warning */
        warning(title, message, options = {}) {
            return this.add('warning', title, message, options);
        },

        /** Shortcut: Tambah notifikasi success */
        success(title, message, options = {}) {
            return this.add('success', title, message, { duration: 4000, ...options });
        },

        /** Shortcut: Tambah notifikasi info */
        info(title, message, options = {}) {
            return this.add('info', title, message, { duration: 5000, ...options });
        }
    };
}

function getDefaultIcon(type) {
    switch (type) {
        case 'urgent':  return '🚨';
        case 'warning': return '⚠️';
        case 'success': return '✅';
        case 'info':    return 'ℹ️';
        default:        return '🔔';
    }
}

function getDuration(type) {
    switch (type) {
        case 'urgent':  return 12000; // 12 detik (penting, jangan terlalu cepat hilang)
        case 'warning': return 10000; // 10 detik
        case 'success': return 4000;  // 4 detik
        case 'info':    return 6000;  // 6 detik
        default:        return 6000;
    }
}

export const notificationStore = createNotificationStore();

// ============================================================
// Smart Notification Check — dipanggil saat app load / refresh
// ============================================================
let lastCheckTimestamp = 0;

/**
 * Cek semua kondisi dan trigger notifikasi yang relevan
 * Mencegah spam: minimal jeda 30 detik antar pengecekan
 */
export function checkAndNotify() {
    const now = Date.now();
    if (now - lastCheckTimestamp < 30000) return; // Jeda minimal 30 detik
    lastCheckTimestamp = now;

    const records = get(recordsStore);
    const stock   = get(filterStockStore);

    const notifications = [];

    // ──────────────────────────────────────────────
    // 1. JATUH TEMPO (Urgent) — Unit overdue
    // ──────────────────────────────────────────────
    const overdueUnits = records.filter(r =>
        r.computed_status === 'JATUH TEMPO'
    );
    if (overdueUnits.length > 0) {
        const topUnits = overdueUnits.slice(0, 3).map(u =>
            `• ${u.estate} (${u.group}) — Lewat ${Math.abs(u.days_left)} hari`
        ).join('\n');

        notifications.push({
            type: 'urgent',
            title: `🚨 ${overdueUnits.length} Unit Jatuh Tempo!`,
            message: overdueUnits.length <= 3
                ? topUnits
                : `${topUnits}\n... dan ${overdueUnits.length - 3} unit lainnya`,
            options: {
                icon: '🚨',
                actionLabel: 'Lihat Notice Harian',
                actionHref: '/',
                duration: 15000
            }
        });
    }

    // ──────────────────────────────────────────────
    // 2. NOTICE (Warning) — ≤10 hari, harus hubungi PIC
    // ──────────────────────────────────────────────
    const noticeUnits = records.filter(r =>
        r.computed_status === 'NOTICE'
    );
    if (noticeUnits.length > 0) {
        const urgent5days = noticeUnits.filter(u => u.days_left <= 5);
        const message = urgent5days.length > 0
            ? `${urgent5days.length} unit sisa ≤ 5 hari! Segera hubungi PIC konsumen.\nTotal notice: ${noticeUnits.length} unit.`
            : `${noticeUnits.length} unit memasuki masa peringatan (≤10 hari). Segera jadwalkan kunjungan servis.`;

        notifications.push({
            type: 'warning',
            title: `⚠️ ${noticeUnits.length} Unit Perlu Ditindaklanjuti`,
            message,
            options: {
                icon: '⚠️',
                actionLabel: 'Hubungi PIC',
                actionHref: '/',
                duration: 12000
            }
        });
    }


    // ──────────────────────────────────────────────
    // 4. UNIT TERLANTAR (>180 hari tanpa servis)
    // ──────────────────────────────────────────────
    const today = new Date();
    const terlantarUnits = records.filter(r => {
        if (r.computed_status === 'NON-AKTIF') return false;
        const lastDate = r.last_maintenance || r.install_date;
        if (!lastDate) return false;
        const lastDt = new Date(lastDate);
        const diffDays = Math.floor((today - lastDt) / (1000 * 60 * 60 * 24));
        return diffDays > 180; // >6 bulan
    });

    if (terlantarUnits.length > 0) {
        notifications.push({
            type: 'warning',
            title: `⏰ ${terlantarUnits.length} Unit Terlantar (>6 Bulan)`,
            message: `Ada unit yang sudah lebih dari 6 bulan tanpa catatan maintenance. Cek dan perbarui data.`,
            options: {
                icon: '⏰',
                actionLabel: 'Lihat Data Unit',
                actionHref: '/records',
                duration: 10000
            }
        });
    }

    return notifications;
}

// ============================================================
// Mute State Store (persisted)
// ============================================================
export const muteStore = writable(false);

/** Inisialisasi mute dari localStorage */
export function initMuteState() {
    try {
        const saved = localStorage.getItem('notif_muted');
        if (saved === '1') muteStore.set(true);
    } catch {}
}
