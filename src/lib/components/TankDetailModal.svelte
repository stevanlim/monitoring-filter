<script>
    import { recordsStore, photoDirectoryStore } from "$lib/stores/filterStore";
    import { notificationStore } from "$lib/stores/notificationStore";
    import {
        buildWhatsAppUrl,
        parsePicContact,
    } from "$lib/utils/whatsappHelper.js";

    let {
        tankId = null,
        isOpen = false,
        onClose = () => {},
        onOpenService = () => {},
    } = $props();

    let detail = $state(null);
    let isLoading = $state(false);
    let isDeleting = $state(false);
    let isConfirmDeleteOpen = $state(false);
    let activePhotoPreview = $state(null);
    let activeTab = $state("timeline"); // 'timeline' | 'photos' | 'specs'

    // Reactivation with PIN state
    let isConfirmActivateOpen = $state(false);
    let activatePin = $state("");
    let activateError = $state("");
    let isActivating = $state(false);

    let picContactInfo = $derived(parsePicContact(detail));

    $effect(() => {
        if (isOpen && tankId) {
            loadTankDetail(tankId);
        } else if (!isOpen) {
            detail = null;
            activePhotoPreview = null;
            isConfirmDeleteOpen = false;
            isConfirmActivateOpen = false;
            activatePin = "";
            activateError = "";
        }
    });

    async function handleDeleteTank() {
        if (!detail) return;
        isDeleting = true;
        try {
            await recordsStore.deleteTank(detail.id);
            isConfirmDeleteOpen = false;
            onClose();
        } finally {
            isDeleting = false;
        }
    }

    async function handleDeactivateTank() {
        if (!detail) return;
        if (
            !confirm(
                `Non-aktifkan unit tangki ${detail.estate} (${detail.group})? Unit ini tidak akan memicu notice harian lagi.`,
            )
        )
            return;
        await recordsStore.deactivateTank(detail.id, "NON-AKTIF");
        await loadTankDetail(detail.id);
    }

    function openActivateModal() {
        activatePin = "";
        activateError = "";
        isConfirmActivateOpen = true;
    }

    async function handleActivateSubmit(e) {
        e?.preventDefault();
        if (!detail || isActivating) return;

        if (!activatePin || activatePin.trim().length !== 6) {
            activateError = "PIN Keamanan harus 6 digit angka!";
            return;
        }

        isActivating = true;
        activateError = "";

        try {
            // Verifikasi PIN
            const verifyRes = await fetch("/api/auth/verify-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: activatePin.trim() }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.valid) {
                activateError =
                    verifyData.error ||
                    "PIN Keamanan salah! Otorisasi reaktivasi ditolak.";
                isActivating = false;
                return;
            }

            // Aktifkan tangki
            const res = await recordsStore.activateTank(detail.id);
            if (res && res.success) {
                isConfirmActivateOpen = false;
                activatePin = "";
                notificationStore.success(
                    'Unit Diaktifkan Kembali',
                    `Unit ${detail.estate} (${detail.group}) berhasil diaktifkan dan kembali dipantau.`
                );
                await loadTankDetail(detail.id);
            } else {
                activateError = res?.error || "Gagal mengaktifkan unit.";
            }
        } catch (err) {
            activateError = "Terjadi kesalahan sistem saat verifikasi PIN.";
        } finally {
            isActivating = false;
        }
    }

    async function loadTankDetail(id) {
        isLoading = true;
        try {
            const data = await recordsStore.getTankDetail(id);
            detail = data;
        } catch (err) {
            console.error("[loadTankDetail]", err);
        } finally {
            isLoading = false;
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
        <div
            class="bg-[#0d1424] border border-slate-700/60 rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[96vh] sm:max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden text-left"
        >
            <!-- Header Modal -->
            <div
                class="p-3.5 sm:p-6 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap justify-between items-center gap-2 sm:gap-4 shrink-0"
            >
                <div class="min-w-0 flex-1">
                    <div
                        class="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1 truncate"
                    >
                        <span>🏢 {detail?.group || "Group"}</span>
                        <span>•</span>
                        <span>🗺️ {detail?.region || "Umum"}</span>
                        {#if detail?.location_type}
                            <span>•</span>
                            <span class="text-sky-400 font-semibold">📍 {detail.location_type}</span>
                        {/if}
                    </div>
                    <h2
                        class="text-base sm:text-2xl font-black text-white truncate flex items-center gap-2 sm:gap-2.5"
                    >
                        <span>🛢️</span>
                        {detail?.estate || "Detail Unit Tangki"}
                    </h2>
                </div>

                <div class="flex items-center gap-2">
                    {#if detail}
                        {#if detail.computed_status === "JATUH TEMPO"}
                            <span
                                class="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black uppercase"
                            >
                                🚨 Lewat {Math.abs(detail.days_left)} Hari
                            </span>
                        {:else if detail.computed_status === "NOTICE"}
                            <span
                                class="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-black uppercase"
                            >
                                ⚠️ Sisa {detail.days_left} Hari
                            </span>
                        {:else if detail.computed_status === "NON-AKTIF"}
                            <span
                                class="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold"
                            >
                                ⚪ Non-Aktif
                            </span>
                        {:else}
                            <span
                                class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase"
                            >
                                ✅ Sisa {detail.days_left} Hari
                            </span>
                        {/if}
                    {/if}

                    <button
                        onclick={onClose}
                        class="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-all"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <div
                class="px-3 sm:px-6 border-b border-slate-800 flex items-center gap-1.5 sm:gap-2 bg-slate-950/40 text-xs font-semibold shrink-0 overflow-x-auto"
            >
                <button
                    onclick={() => (activeTab = "timeline")}
                    class="py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 {activeTab ===
                    'timeline'
                        ? 'border-sky-500 text-sky-400 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'}"
                >
                    <span>⏳</span> Riwayat Kronologis & Foto
                    {#if detail?.maintenance_history?.length > 0}
                        <span
                            class="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-[10px] text-sky-300"
                        >
                            {detail.maintenance_history.length}
                        </span>
                    {/if}
                </button>

                <button
                    onclick={() => (activeTab = "photos")}
                    class="py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 {activeTab ===
                    'photos'
                        ? 'border-sky-500 text-sky-400 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'}"
                >
                    <span>📷</span> Galeri Foto ({detail?.all_photos?.length ||
                        0})
                </button>

                <button
                    onclick={() => (activeTab = "specs")}
                    class="py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 {activeTab ===
                    'specs'
                        ? 'border-sky-500 text-sky-400 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'}"
                >
                    <span>⚙️</span> Spesifikasi & PIC
                </button>
            </div>

            <!-- Modal Content Area -->
            <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {#if isLoading}
                    <div
                        class="py-20 flex flex-col items-center justify-center space-y-3"
                    >
                        <div
                            class="w-10 h-10 border-3 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"
                        ></div>
                        <p class="text-xs text-slate-400 font-medium">
                            Memuat detail riwayat & foto tangki...
                        </p>
                    </div>
                {:else if detail}
                    <!-- Quick Stats Banner -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div
                            class="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 text-center"
                        >
                            <span
                                class="text-[10px] uppercase font-bold text-slate-500"
                                >Pemasangan Awal</span
                            >
                            <div class="text-sm font-bold text-white mt-1">
                                {detail.install_date || "-"}
                            </div>
                        </div>

                        <div
                            class="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 text-center"
                        >
                            <span
                                class="text-[10px] uppercase font-bold text-slate-500"
                                >Total Pergantian Filter</span
                            >
                            <div class="text-sm font-bold text-sky-400 mt-1">
                                {detail.maintenance_count || 0}x Servis
                            </div>
                        </div>

                        <div
                            class="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 text-center"
                        >
                            <span
                                class="text-[10px] uppercase font-bold text-slate-500"
                                >Servis Terakhir</span
                            >
                            <div class="text-sm font-bold text-slate-300 mt-1">
                                {detail.last_maintenance || "-"}
                            </div>
                        </div>

                        <div
                            class="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 text-center"
                        >
                            <span
                                class="text-[10px] uppercase font-bold text-slate-500"
                                >Target Servis Berikut</span
                            >
                            <div class="text-sm font-bold text-amber-400 mt-1">
                                {detail.next_maintenance || "-"}
                            </div>
                        </div>
                    </div>

                    <!-- TAB 1: KRONOLOGIS TIMELINE DARI PEMASANGAN HINGGA SERVIS -->
                    {#if activeTab === "timeline"}
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <h4
                                    class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"
                                >
                                    <span>⏱️</span> Kronologi Lifecycle Filter &
                                    Foto Dokumentasi
                                </h4>
                                <span class="text-[11px] text-slate-500">
                                    Total {detail.maintenance_history?.length ||
                                        0} Rekaman Riwayat
                                </span>
                            </div>

                            {#if !detail.maintenance_history || detail.maintenance_history.length === 0}
                                <div
                                    class="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-500"
                                >
                                    Belum ada catatan riwayat maintenance pada
                                    unit ini.
                                </div>
                            {:else}
                                <div
                                    class="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-6 my-2"
                                >
                                    {#each detail.maintenance_history as item, idx}
                                        <div class="relative group">
                                            <!-- Timeline Pin Marker -->
                                            <div
                                                class="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold {item.is_initial
                                                    ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/30'
                                                    : 'bg-sky-500 border-sky-400 text-black shadow-lg shadow-sky-500/20'}"
                                            >
                                                {#if item.is_initial}
                                                    🚀
                                                {:else}
                                                    {item.service_number || idx}
                                                {/if}
                                            </div>

                                            <!-- Timeline Card -->
                                            <div
                                                class="rounded-2xl border bg-slate-900/50 p-4 space-y-3 transition-all {item.is_initial
                                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                                    : 'border-slate-800 hover:border-slate-700'}"
                                            >
                                                <!-- Card Header -->
                                                <div
                                                    class="flex flex-wrap justify-between items-start gap-2"
                                                >
                                                    <div>
                                                        <div
                                                            class="flex items-center gap-2"
                                                        >
                                                            <span
                                                                class="text-sm font-bold {item.is_initial
                                                                    ? 'text-emerald-400'
                                                                    : 'text-white'}"
                                                            >
                                                                {item.title}
                                                            </span>
                                                            {#if item.is_initial}
                                                                <span
                                                                    class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase"
                                                                >
                                                                    Install Awal
                                                                </span>
                                                            {/if}
                                                        </div>
                                                        <p
                                                            class="text-xs text-slate-400 mt-0.5"
                                                        >
                                                            {item.notes}
                                                        </p>
                                                    </div>

                                                    <div class="text-right">
                                                        <div
                                                            class="text-xs font-bold text-sky-400 font-mono"
                                                        >
                                                            📅 {item.service_date}
                                                        </div>
                                                        <div
                                                            class="text-[10px] text-slate-500 mt-0.5"
                                                        >
                                                            Interval: {item.interval_months || 90} Hari
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Teknisi & Uploader -->
                                                <div
                                                    class="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800/60"
                                                >
                                                    <span
                                                        >👤 Pelaksana / Teknisi:</span
                                                    >
                                                    <span
                                                        class="text-slate-200 font-medium"
                                                        >{item.technician}</span
                                                    >
                                                </div>

                                                <!-- Foto Dokumentasi pada Event Ini -->
                                                {#if item.photos && item.photos.length > 0}
                                                    <div
                                                        class="pt-2 border-t border-slate-800/60 space-y-2"
                                                    >
                                                        <div
                                                            class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                                                        >
                                                            📷 Foto Dokumentasi
                                                            ({item.photos
                                                                .length}):
                                                        </div>
                                                        <div
                                                            class="grid grid-cols-2 sm:grid-cols-3 gap-3"
                                                        >
                                                            {#each item.photos as p}
                                                                <button
                                                                    onclick={() =>
                                                                        (activePhotoPreview =
                                                                            p)}
                                                                    class="rounded-xl overflow-hidden border border-slate-800 hover:border-sky-500/50 bg-slate-950 group/photo relative text-left"
                                                                >
                                                                    <div
                                                                        class="h-28 w-full bg-slate-900 overflow-hidden"
                                                                    >
                                                                        <img
                                                                            src={p.url}
                                                                            alt={p.caption}
                                                                            class="w-full h-full object-cover group-hover/photo:scale-105 transition-all duration-300"
                                                                        />
                                                                    </div>
                                                                    <div
                                                                        class="p-2 text-[10px] text-slate-400 truncate"
                                                                    >
                                                                        {p.filename}
                                                                    </div>
                                                                </button>
                                                            {/each}
                                                        </div>
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}

                                    <!-- Next Maintenance Milestone -->
                                    <div class="relative group">
                                        <div
                                            class="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full border-2 bg-amber-500 border-amber-400 flex items-center justify-center text-xs text-black font-bold shadow-lg shadow-amber-500/20"
                                        >
                                            ⏳
                                        </div>

                                        <div
                                            class="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 flex flex-wrap justify-between items-center gap-3"
                                        >
                                            <div>
                                                <div
                                                    class="text-sm font-bold text-amber-300"
                                                >
                                                    Jadwal Servis & Pergantian
                                                    Berikutnya
                                                </div>
                                                <div
                                                    class="text-xs text-slate-400 mt-0.5"
                                                >
                                                    Target Maintenance: <span
                                                        class="font-bold text-white font-mono"
                                                        >{detail.next_maintenance}</span
                                                    >
                                                </div>
                                            </div>

                                            <button
                                                onclick={() => {
                                                    onClose();
                                                    onOpenService(detail);
                                                }}
                                                class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
                                            >
                                                <span>🛠️</span> Lakukan Servis Sekarang
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    <!-- TAB 2: GALERI SELURUH FOTO TANGKI INI -->
                    {#if activeTab === "photos"}
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <h4
                                    class="text-xs font-bold uppercase tracking-wider text-slate-400"
                                >
                                    Galeri Foto Dokumentasi Filter Tangki Ini ({detail
                                        .all_photos?.length || 0})
                                </h4>
                            </div>

                            {#if !detail.all_photos || detail.all_photos.length === 0}
                                <div
                                    class="rounded-2xl border-2 border-dashed border-slate-800 p-12 text-center text-xs text-slate-500"
                                >
                                    <div class="text-3xl mb-2 opacity-40">
                                        📷
                                    </div>
                                    Belum ada file foto yang terupload untuk unit
                                    tangki ini.
                                </div>
                            {:else}
                                <div
                                    class="grid grid-cols-2 sm:grid-cols-3 gap-4"
                                >
                                    {#each detail.all_photos as photo}
                                        <button
                                            onclick={() =>
                                                (activePhotoPreview = photo)}
                                            class="rounded-2xl border border-slate-800 hover:border-sky-500/50 bg-slate-950 overflow-hidden text-left group transition-all"
                                        >
                                            <div
                                                class="h-36 w-full bg-slate-900 relative overflow-hidden"
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt={photo.caption}
                                                    class="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                                />
                                                <div
                                                    class="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[10px] text-slate-300 border border-slate-700"
                                                >
                                                    📅 {photo.date}
                                                </div>
                                            </div>
                                            <div class="p-3 space-y-1 text-xs">
                                                <div
                                                    class="font-bold text-white truncate group-hover:text-sky-400"
                                                >
                                                    {photo.caption ||
                                                        photo.filename}
                                                </div>
                                                <div
                                                    class="text-[10px] text-slate-500"
                                                >
                                                    Oleh: {photo.uploader ||
                                                        "Teknisi"}
                                                </div>
                                            </div>
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}

                    <!-- TAB 3: SPESIFIKASI & KONTAK PIC -->
                    {#if activeTab === "specs"}
                        <div class="space-y-4 text-xs">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div
                                    class="rounded-2xl bg-slate-900/50 border border-slate-800 p-4 space-y-3"
                                >
                                    <div
                                        class="font-bold text-sky-400 uppercase tracking-wider text-[11px]"
                                    >
                                        Spesifikasi Tangki & Filter
                                    </div>
                                    <div class="space-y-2">
                                        <div
                                            class="flex justify-between border-b border-slate-800/60 pb-1.5"
                                        >
                                            <span class="text-slate-500"
                                                >Group Perusahaan:</span
                                            >
                                            <span class="font-bold text-white"
                                                >{detail.group}</span
                                            >
                                        </div>
                                        <div
                                            class="flex justify-between border-b border-slate-800/60 pb-1.5"
                                        >
                                            <span class="text-slate-500"
                                                >Nama PT / Estate:</span
                                            >
                                            <span class="font-bold text-white"
                                                >{detail.estate}</span
                                            >
                                        </div>
                                        <div
                                            class="flex justify-between border-b border-slate-800/60 pb-1.5"
                                        >
                                            <span class="text-slate-500"
                                                >Tipe Lokasi:</span
                                            >
                                            <span class="font-bold text-sky-400"
                                                >{detail.location_type || "Kebun"}</span
                                            >
                                        </div>
                                        <div
                                            class="flex justify-between border-b border-slate-800/60 pb-1.5"
                                        >
                                            <span class="text-slate-500"
                                                >Wilayah:</span
                                            >
                                            <span class="text-slate-300"
                                                >{detail.region || "Umum"}</span
                                            >
                                        </div>
                                        <div
                                            class="flex justify-between border-b border-slate-800/60 pb-1.5"
                                        >
                                            <span class="text-slate-500"
                                                >Nama / Tipe Unit:</span
                                            >
                                            <span class="font-bold text-white"
                                                >{detail.unit_name ||
                                                    detail.tank_capacity ||
                                                    "Tangki Timbun Solar"}</span
                                            >
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-500"
                                                >Model Filter:</span
                                            >
                                            <span class="font-bold text-sky-400"
                                                >{detail.equipment}</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <div
                                    class="rounded-2xl bg-slate-900/50 border border-slate-800 p-4 space-y-3"
                                >
                                    <div
                                        class="font-bold text-emerald-400 uppercase tracking-wider text-[11px]"
                                    >
                                        Kontak PIC & Siklus Servis
                                    </div>
                                    <div class="space-y-2">
                                        <div
                                            class="flex justify-between border-b border-slate-800/60 pb-1.5"
                                        >
                                            <span class="text-slate-500"
                                                >Nama PIC:</span
                                            >
                                            <span class="font-bold text-white"
                                                >{picContactInfo.name}</span
                                            >
                                        </div>
                                        <div
                                            class="flex justify-between border-b border-slate-800/60 pb-1.5"
                                        >
                                            <span class="text-slate-500"
                                                >Nomor WhatsApp:</span
                                            >
                                            <span
                                                class="font-mono text-emerald-400 font-bold"
                                                >{picContactInfo.hasPhone
                                                    ? picContactInfo.rawPhone ||
                                                      "+" + picContactInfo.phone
                                                    : detail.phone_number
                                                      ? `+${detail.phone_number}`
                                                      : "-"}</span
                                            >
                                        </div>
                                        <div
                                            class="flex justify-between border-b border-slate-800/60 pb-1.5"
                                        >
                                            <span class="text-slate-500"
                                                >Interval Maintenance:</span
                                            >
                                            <span class="font-bold text-white"
                                                >{detail.interval_months || 90} Hari</span
                                            >
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-500"
                                                >Status Operasional:</span
                                            >
                                            <span
                                                class="font-bold text-emerald-400"
                                                >{detail.status_mc ||
                                                    "AKTIF"}</span
                                            >
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {#if detail.notes}
                                <div
                                    class="rounded-2xl bg-slate-900/30 border border-slate-800 p-4"
                                >
                                    <div
                                        class="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1"
                                    >
                                        Catatan Tambahan:
                                    </div>
                                    <p class="text-slate-300 leading-relaxed">
                                        {detail.notes}
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/if}
            </div>

            <!-- Footer Actions -->
            <div
                class="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex flex-wrap justify-between items-center gap-3 shrink-0"
            >
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        onclick={() => (isConfirmDeleteOpen = true)}
                        class="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                        <span>🗑️</span> Hapus Unit
                    </button>

                    {#if detail?.status_mc === "NON-AKTIF"}
                        <button
                            type="button"
                            onclick={openActivateModal}
                            class="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                            title="Aktifkan kembali unit tangki ini (memerlukan PIN)"
                        >
                            <span>⚡</span> Aktifkan Kembali
                        </button>
                    {:else}
                        <button
                            type="button"
                            onclick={handleDeactivateTank}
                            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
                            title="Tandai unit sudah tidak aktif/tidak digunakan"
                        >
                            ⚪ Non-aktifkan
                        </button>
                    {/if}
                </div>

                <div class="flex items-center gap-2">
                    <a
                        href={buildWhatsAppUrl(detail)}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-4 py-2 rounded-xl {picContactInfo.hasPhone
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-slate-800 text-slate-300 hover:text-white'} text-xs font-bold transition-all flex items-center gap-1.5"
                        title={picContactInfo.hasPhone
                            ? `Hubungi ${picContactInfo.name} (${picContactInfo.phone}) via WhatsApp`
                            : "Hubungi via WhatsApp"}
                    >
                        <span>💬</span> Hubungi PIC (WA)
                    </a>

                    <button
                        onclick={() => {
                            const rec = detail;
                            onClose();
                            onOpenService(rec);
                        }}
                        class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                    >
                        <span>🛠️</span> Catat Maintenance
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- Modal Konfirmasi Hapus Unit Tangki -->
{#if isConfirmDeleteOpen && detail}
    <div
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
    >
        <div
            class="bg-[#0d1424] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left"
        >
            <div
                class="flex items-center gap-3 pb-4 border-b border-slate-800 text-rose-400"
            >
                <div
                    class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-xl shrink-0"
                >
                    🗑️
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">
                        Hapus Unit Tangki & Filter
                    </h3>
                    <p class="text-[11px] text-slate-400">
                        Konfirmasi tindakan penghapusan permanen
                    </p>
                </div>
            </div>

            <div class="space-y-3 my-4 text-xs text-slate-300">
                <p>
                    Apakah Anda yakin ingin menghapus unit <span
                        class="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                        >{detail.estate}</span
                    >
                    ({detail.group})?
                </p>
                <div
                    class="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300 space-y-1 text-[11px]"
                >
                    <div class="font-bold">⚠️ Perhatian:</div>
                    <div>
                        Seluruh riwayat maintenance ({detail.maintenance_history
                            ?.length || 0} event) dan file foto yang terlampir akan
                        dihapus dari sistem.
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                    type="button"
                    onclick={() => (isConfirmDeleteOpen = false)}
                    class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onclick={handleDeleteTank}
                    disabled={isDeleting}
                    class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {#if isDeleting}
                        <span
                            class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        ></span>
                        Menghapus...
                    {:else}
                        Ya, Hapus Permanen
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Modal Konfirmasi Reaktivasi Tangki (Wajib PIN) -->
{#if isConfirmActivateOpen && detail}
    <div
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
    >
        <div
            class="bg-[#0d1424] border border-emerald-500/40 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-left"
        >
            <div
                class="flex items-center gap-3 pb-4 border-b border-slate-800 text-emerald-400"
            >
                <div
                    class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xl shrink-0"
                >
                    ⚡
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">
                        Aktifkan Kembali Unit
                    </h3>
                    <p class="text-[11px] text-slate-400">
                        Otorisasi PIN Keamanan Diperlukan
                    </p>
                </div>
            </div>

            <form
                onsubmit={handleActivateSubmit}
                class="space-y-4 my-4 text-xs"
            >
                <div
                    class="p-3 bg-slate-900/80 rounded-2xl border border-slate-800"
                >
                    <div class="text-[10px] text-slate-500 font-bold uppercase">
                        {detail.group}
                    </div>
                    <div class="text-sm font-bold text-white mt-0.5">
                        {detail.estate}
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5">
                        {detail.equipment}
                    </div>
                </div>

                <div
                    class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2"
                >
                    <div
                        class="flex items-center gap-2 text-amber-400 font-bold text-[11px]"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-4 h-4 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                        <span>Konfirmasi PIN (6 Digit) *</span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight">
                        Masukkan PIN keamanan (contoh: 789000) untuk
                        mengembalikan unit ke status aktif.
                    </p>
                    <input
                        type="password"
                        maxlength="6"
                        pattern="[0-9]*"
                        inputmode="numeric"
                        bind:value={activatePin}
                        placeholder="•••••• (6 Digit PIN)"
                        required
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-mono tracking-widest text-center text-lg placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                </div>

                {#if activateError}
                    <div
                        class="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300"
                    >
                        {activateError}
                    </div>
                {/if}

                <div
                    class="flex justify-end gap-2.5 pt-3 border-t border-slate-800"
                >
                    <button
                        type="button"
                        onclick={() => (isConfirmActivateOpen = false)}
                        class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isActivating ||
                            !activatePin ||
                            activatePin.length !== 6}
                        class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {#if isActivating}
                            <span
                                class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            ></span>
                            <span>Memverifikasi...</span>
                        {:else}
                            <span>⚡ Aktifkan Unit</span>
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Preview Foto Modal -->
{#if activePhotoPreview}
    <div
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
    >
        <div
            class="bg-[#0d1424] border border-slate-700/60 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative text-left"
        >
            <div
                class="p-4 border-b border-slate-800 flex justify-between items-center"
            >
                <div class="text-xs font-bold text-sky-400">
                    📁 {activePhotoPreview.group} / {activePhotoPreview.region} /
                    {activePhotoPreview.estate}
                </div>
                <button
                    onclick={() => (activePhotoPreview = null)}
                    class="text-slate-400 hover:text-white text-lg">✕</button
                >
            </div>

            <div
                class="p-4 bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[65vh]"
            >
                <img
                    src={activePhotoPreview.url}
                    alt={activePhotoPreview.caption}
                    class="max-h-[60vh] max-w-full rounded-xl object-contain border border-slate-800"
                />
            </div>

            <div
                class="p-4 bg-slate-900 text-xs space-y-2 border-t border-slate-800"
            >
                <div class="flex justify-between items-start gap-4">
                    <div>
                        <div class="font-bold text-white text-sm">
                            {activePhotoPreview.caption ||
                                activePhotoPreview.filename}
                        </div>
                        <div class="text-slate-400 mt-0.5">
                            Tanggal Servis: <span
                                class="text-emerald-400 font-bold"
                                >{activePhotoPreview.date || "-"}</span
                            >
                        </div>
                        <div class="text-slate-500 text-[11px]">
                            Di-upload oleh: {activePhotoPreview.uploader ||
                                "Teknisi"}
                        </div>
                    </div>
                    <button
                        onclick={async () => {
                            if (
                                confirm(
                                    "Yakin ingin menghapus foto dokumentasi ini?",
                                )
                            ) {
                                const photoToDelete = activePhotoPreview;
                                activePhotoPreview = null;
                                await photoDirectoryStore.deletePhoto(
                                    photoToDelete.id,
                                    photoToDelete.filepath,
                                );
                                if (detail?.id) {
                                    await loadTankDetail(detail.id);
                                }
                            }
                        }}
                        class="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                        Hapus Foto
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
