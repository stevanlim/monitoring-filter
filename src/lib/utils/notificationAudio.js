/**
 * src/lib/utils/notificationAudio.js
 * 
 * Sistem audio notifikasi menggunakan Web Audio API.
 * Menghasilkan nada dering modern tanpa file audio eksternal.
 * 4 tipe suara: urgent (jatuh tempo), warning (notice/stok), success, info.
 */

let audioCtx = null;
let isMuted = false;

/** Inisialisasi AudioContext (harus dipanggil setelah user gesture) */
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/** Set mute state */
export function setMuted(muted) {
    isMuted = muted;
    // Persist preference
    try { localStorage.setItem('notif_muted', muted ? '1' : '0'); } catch {}
}

/** Get mute state */
export function getMuted() {
    try {
        const saved = localStorage.getItem('notif_muted');
        if (saved !== null) isMuted = saved === '1';
    } catch {}
    return isMuted;
}

/** Toggle mute */
export function toggleMute() {
    setMuted(!isMuted);
    return isMuted;
}

/**
 * 🚨 URGENT — Nada alarm untuk jatuh tempo / overdue
 * Dua nada tinggi berulang (meningkatkan urgensi)
 */
export function playUrgentSound() {
    if (isMuted) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Nada 1: C6 (1047 Hz)
        playTone(ctx, 1047, now, 0.15, 0.25, 'sine');
        // Jeda pendek
        playTone(ctx, 1319, now + 0.2, 0.15, 0.25, 'sine');
        // Nada 3: C6 lagi (pengulangan = urgensi)
        playTone(ctx, 1047, now + 0.4, 0.15, 0.2, 'sine');
        playTone(ctx, 1319, now + 0.6, 0.15, 0.2, 'sine');
    } catch (e) {
        console.warn('[notifAudio] urgent sound error:', e);
    }
}

/**
 * ⚠️ WARNING — Nada peringatan untuk notice mendekati / stok menipis
 * Tiga nada descending yang lembut tapi tegas
 */
export function playWarningSound() {
    if (isMuted) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        playTone(ctx, 880, now, 0.18, 0.2, 'sine');       // A5
        playTone(ctx, 740, now + 0.22, 0.18, 0.2, 'sine'); // F#5
        playTone(ctx, 660, now + 0.44, 0.22, 0.18, 'sine'); // E5
    } catch (e) {
        console.warn('[notifAudio] warning sound error:', e);
    }
}

/**
 * ✅ SUCCESS — Nada konfirmasi aksi berhasil
 * Dua nada ascending singkat (ting-ting naik = sukses)
 */
export function playSuccessSound() {
    if (isMuted) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        playTone(ctx, 523, now, 0.1, 0.15, 'sine');       // C5
        playTone(ctx, 659, now + 0.12, 0.1, 0.15, 'sine'); // E5
        playTone(ctx, 784, now + 0.24, 0.15, 0.2, 'sine'); // G5
    } catch (e) {
        console.warn('[notifAudio] success sound error:', e);
    }
}

/**
 * ℹ️ INFO — Nada lembut informatif
 * Satu nada singkat "ding"
 */
export function playInfoSound() {
    if (isMuted) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        playTone(ctx, 700, now, 0.12, 0.12, 'sine');
    } catch (e) {
        console.warn('[notifAudio] info sound error:', e);
    }
}

/**
 * Internal: Mainkan satu nada tunggal
 * @param {AudioContext} ctx
 * @param {number} freq - Frekuensi Hz
 * @param {number} startTime - Waktu mulai (ctx.currentTime based)
 * @param {number} duration - Durasi nada (detik)
 * @param {number} volume - Volume (0-1)
 * @param {string} type - Tipe osilator: 'sine','square','triangle','sawtooth'
 */
function playTone(ctx, freq, startTime, duration, volume = 0.15, type = 'sine') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envelope: fade-in cepat, sustain, fade-out halus
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume, startTime + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

/**
 * Kirim Browser Notification (jika tab di background dan user sudah izinkan)
 */
export async function sendBrowserNotification(title, body, icon = '🔔') {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    
    if (Notification.permission === 'granted') {
        try {
            new Notification(title, {
                body,
                icon: '/favicon.png',
                badge: '/favicon.png',
                tag: 'filter-monitoring-' + Date.now(),
                requireInteraction: false,
                silent: true // kita sudah punya audio sendiri
            });
        } catch (e) {
            // Notification constructor tidak didukung di beberapa env
        }
    }
}

/** Minta izin notifikasi browser di awal */
export function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}
