<script>
    import { fly, fade } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { notificationStore, checkAndNotify, muteStore, initMuteState } from '$lib/stores/notificationStore.js';
    import {
        playUrgentSound,
        playWarningSound,
        playSuccessSound,
        playInfoSound,
        getMuted,
        setMuted,
        toggleMute,
        requestNotificationPermission,
        sendBrowserNotification
    } from '$lib/utils/notificationAudio.js';
    import { goto } from '$app/navigation';

    let hasInteracted = $state(false);
    let pendingNotifications = $state([]);
    let showMuteTooltip = $state(false);

    // Inisialisasi mute state dari localStorage
    $effect(() => {
        initMuteState();
    });

    // Dengarkan notifikasi baru untuk memainkan suara
    let lastPlayedId = 0;
    $effect(() => {
        const list = $notificationStore;
        if (!list.length) return;

        const newest = list[list.length - 1];
        if (newest.id <= lastPlayedId) return;
        lastPlayedId = newest.id;

        if (hasInteracted && !$muteStore) {
            switch (newest.type) {
                case 'urgent':  playUrgentSound(); break;
                case 'warning': playWarningSound(); break;
                case 'success': playSuccessSound(); break;
                case 'info':    playInfoSound(); break;
            }
        }

        // Browser notification jika tab tidak fokus
        if (document.hidden && (newest.type === 'urgent' || newest.type === 'warning')) {
            sendBrowserNotification(newest.title, newest.message);
        }
    });

    // Pertama kali user interaksi (klik/sentuh), aktifkan audio & cek notifikasi
    function handleFirstInteraction() {
        if (hasInteracted) return;
        hasInteracted = true;
        requestNotificationPermission();

        // Cek semua kondisi dan tampilkan notifikasi
        const alerts = checkAndNotify();
        if (alerts && alerts.length > 0) {
            // Tunda sedikit agar UI siap
            setTimeout(() => {
                alerts.forEach((alert, idx) => {
                    setTimeout(() => {
                        notificationStore.add(alert.type, alert.title, alert.message, alert.options);
                    }, idx * 800); // Stagger 800ms per notifikasi
                });
            }, 500);
        }
    }

    function handleAction(notif) {
        if (notif.actionHref) {
            goto(notif.actionHref);
        }
        if (notif.action) {
            notif.action();
        }
        notificationStore.dismiss(notif.id);
    }

    function handleToggleMute() {
        const newMuted = !$muteStore;
        muteStore.set(newMuted);
        setMuted(newMuted);

        // Play test sound jika unmute
        if (!newMuted && hasInteracted) {
            playInfoSound();
        }

        showMuteTooltip = true;
        setTimeout(() => showMuteTooltip = false, 2000);
    }

    function getTypeStyles(type) {
        switch (type) {
            case 'urgent':
                return {
                    bg: 'bg-rose-950/95 border-rose-500/50',
                    iconBg: 'bg-rose-500/20 border-rose-500/30',
                    titleColor: 'text-rose-200',
                    msgColor: 'text-rose-300/90',
                    btnBg: 'bg-rose-600 hover:bg-rose-500 text-white',
                    progressColor: 'bg-rose-500',
                    glow: 'shadow-xl shadow-rose-500/10'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-950/95 border-amber-500/40',
                    iconBg: 'bg-amber-500/20 border-amber-500/30',
                    titleColor: 'text-amber-200',
                    msgColor: 'text-amber-300/80',
                    btnBg: 'bg-amber-600 hover:bg-amber-500 text-white',
                    progressColor: 'bg-amber-500',
                    glow: 'shadow-xl shadow-amber-500/10'
                };
            case 'success':
                return {
                    bg: 'bg-emerald-950/95 border-emerald-500/40',
                    iconBg: 'bg-emerald-500/20 border-emerald-500/30',
                    titleColor: 'text-emerald-200',
                    msgColor: 'text-emerald-300/80',
                    btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
                    progressColor: 'bg-emerald-500',
                    glow: 'shadow-xl shadow-emerald-500/10'
                };
            case 'info':
            default:
                return {
                    bg: 'bg-sky-950/95 border-sky-500/40',
                    iconBg: 'bg-sky-500/20 border-sky-500/30',
                    titleColor: 'text-sky-200',
                    msgColor: 'text-sky-300/80',
                    btnBg: 'bg-sky-600 hover:bg-sky-500 text-white',
                    progressColor: 'bg-sky-500',
                    glow: 'shadow-xl shadow-sky-500/10'
                };
        }
    }
</script>

<!-- Invisible interaction catcher (untuk mengaktifkan Audio API) -->
<svelte:window
    onclick={handleFirstInteraction}
    onkeydown={handleFirstInteraction}
    ontouchstart={handleFirstInteraction}
/>

<!-- Mute Toggle Button (Floating) -->
<div class="fixed bottom-5 left-5 z-[80]">
    <button
        onclick={handleToggleMute}
        class="w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 {$muteStore ? 'bg-slate-900/90 border-slate-700 text-slate-500 hover:border-slate-600' : 'bg-sky-950/90 border-sky-500/40 text-sky-400 hover:border-sky-400'} backdrop-blur-md shadow-lg"
        title={$muteStore ? 'Notifikasi dimatikan — Klik untuk mengaktifkan' : 'Notifikasi aktif — Klik untuk mute'}
    >
        {#if $muteStore}
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
            </svg>
        {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
            </svg>
        {/if}
    </button>

    {#if showMuteTooltip}
        <div 
            class="absolute bottom-12 left-0 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-semibold whitespace-nowrap shadow-lg"
            transition:fade={{ duration: 200 }}
        >
            {$muteStore ? '🔕 Notifikasi Dimatikan' : '🔔 Notifikasi Aktif'}
        </div>
    {/if}
</div>

<!-- Toast Notification Stack (Top-Right) -->
<div class="fixed top-16 right-5 z-[90] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
    {#each $notificationStore as notif (notif.id)}
        {@const styles = getTypeStyles(notif.type)}
        <div
            class="pointer-events-auto rounded-2xl border backdrop-blur-md overflow-hidden {styles.bg} {styles.glow}"
            in:fly={{ x: 320, duration: 400, opacity: 0 }}
            out:fly={{ x: 320, duration: 300, opacity: 0 }}
            animate:flip={{ duration: 300 }}
        >
            <!-- Content -->
            <div class="p-3.5 flex gap-3 items-start">
                <!-- Icon -->
                <div class="w-9 h-9 rounded-xl border flex items-center justify-center text-lg shrink-0 {styles.iconBg}">
                    {notif.icon}
                </div>

                <!-- Text -->
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold {styles.titleColor} leading-snug">{notif.title}</div>
                    <div class="text-[11px] {styles.msgColor} mt-0.5 leading-relaxed whitespace-pre-line line-clamp-3">
                        {notif.message}
                    </div>

                    {#if notif.actionLabel}
                        <button
                            onclick={() => handleAction(notif)}
                            class="mt-2 px-3 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 {styles.btnBg}"
                        >
                            {notif.actionLabel} →
                        </button>
                    {/if}
                </div>

                <!-- Dismiss -->
                <button
                    onclick={() => notificationStore.dismiss(notif.id)}
                    class="text-slate-500 hover:text-white w-5 h-5 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors text-xs shrink-0"
                    title="Tutup"
                >
                    ✕
                </button>
            </div>

            <!-- Progress bar (auto-dismiss countdown) -->
            {#if notif.duration > 0}
                <div class="h-0.5 w-full bg-black/20 relative overflow-hidden">
                    <div 
                        class="h-full {styles.progressColor} opacity-60 absolute left-0 top-0"
                        style="animation: notif-progress {notif.duration}ms linear forwards; width: 100%;"
                    ></div>
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    @keyframes notif-progress {
        from { width: 100%; }
        to { width: 0%; }
    }
</style>
