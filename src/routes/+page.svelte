<script>
    import KPIHeader from '$lib/components/KPIHeader.svelte';
    import ServiceModal from '$lib/components/ServiceModal.svelte';
    import TankDetailModal from '$lib/components/TankDetailModal.svelte';
    import { recordsStore, statsStore, stockAlertStore } from '$lib/stores/filterStore';
    import { buildWhatsAppUrl, parsePicContact } from '$lib/utils/whatsappHelper.js';

    let selectedRecordForService = $state(null);
    let isServiceModalOpen = $state(false);

    let selectedTankIdForDetail = $state(null);
    let isDetailModalOpen = $state(false);

    let noticeRecords = $derived($recordsStore.filter(r =>
        r.computed_status === 'NOTICE' || r.computed_status === 'JATUH TEMPO'
    ));

    // Sort: jatuh tempo first, then by days_left ascending
    let sortedNotice = $derived([...noticeRecords].sort((a, b) => {
        if (a.computed_status === 'JATUH TEMPO' && b.computed_status !== 'JATUH TEMPO') return -1;
        if (b.computed_status === 'JATUH TEMPO' && a.computed_status !== 'JATUH TEMPO') return 1;
        return (a.days_left ?? 0) - (b.days_left ?? 0);
    }));

    function openServiceModal(rec) {
        selectedRecordForService = rec;
        isServiceModalOpen = true;
    }

    function closeServiceModal() {
        isServiceModalOpen = false;
        selectedRecordForService = null;
    }

    function openDetailModal(tankId) {
        selectedTankIdForDetail = tankId;
        isDetailModalOpen = true;
    }

    function closeDetailModal() {
        isDetailModalOpen = false;
        selectedTankIdForDetail = null;
    }
</script>

<div class="space-y-8 animate-fadeIn">

    <!-- KPI Cards -->
    <KPIHeader />

    <!-- Stock Alerts Banner (if any item depleted or low) -->
    {#if $stockAlertStore.habis > 0 || $stockAlertStore.menipis > 0}
        <div class="space-y-3">
            {#if $stockAlertStore.habis > 0}
                <div class="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
                    <div class="flex items-start gap-3.5">
                        <div class="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xl shrink-0">
                            🚨
                        </div>
                        <div>
                            <div class="text-sm font-bold text-rose-200 flex items-center gap-2">
                                <span>Peringatan Kritis: {$stockAlertStore.habis} Tipe Filter Habis (0 Pcs)</span>
                            </div>
                            <p class="text-xs text-rose-300/80 mt-0.5 leading-relaxed">
                                Filter berikut tidak tersedia: 
                                <b class="text-rose-100">
                                    {$stockAlertStore.items_habis.map(i => i.filter_name).join(', ')}
                                </b>. 
                                Servis atau pemasangan baru menggunakan tipe ini akan diblokir sampai stok diisi.
                            </p>
                        </div>
                    </div>

                    <a
                        href="/stock"
                        class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all shrink-0"
                    >
                        Isi Stok Filter &rarr;
                    </a>
                </div>
            {/if}

            {#if $stockAlertStore.menipis > 0}
                <div class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
                    <div class="flex items-start gap-3.5">
                        <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                            ⚠️
                        </div>
                        <div>
                            <div class="text-sm font-bold text-amber-200">
                                Perhatian: {$stockAlertStore.menipis} Tipe Filter Mendekati Batas Minimum
                            </div>
                            <p class="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                                Filter menipis: 
                                <b class="text-amber-100">
                                    {$stockAlertStore.items_menipis.map(i => `${i.filter_name} (${i.quantity} pcs)`).join(', ')}
                                </b>. 
                                Disarankan segera melakukan pemesanan (PO) spare part.
                            </p>
                        </div>
                    </div>

                    <a
                        href="/stock"
                        class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all shrink-0"
                    >
                        Lihat Stok &rarr;
                    </a>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Section header -->
    <div class="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-base">🔔</span>
                Notice Harian Pergantian Filter
            </h2>
            <p class="text-[13px] text-slate-500 mt-1.5 ml-[42px]">
                Konsumen yang filter-nya mendekati atau sudah melewati tanggal jatuh tempo maintenance.
            </p>
        </div>

        <div class="flex items-center gap-2">
            {#if sortedNotice.length > 0}
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    {sortedNotice.length} unit perlu tindakan
                </span>
            {:else if $recordsStore.length > 0}
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Semua aman
                </span>
            {/if}
        </div>
    </div>

    <!-- Content -->
    {#if $recordsStore.length === 0}
        <!-- Empty state -->
        <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-16 text-center">
            <div class="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-3xl mx-auto mb-4 opacity-60">🛢️</div>
            <div class="text-base font-semibold text-slate-300 mb-1">Belum ada data tangki</div>
            <div class="text-sm text-slate-500">Data akan muncul setelah database MySQL diimport.</div>
        </div>

    {:else if sortedNotice.length === 0}
        <!-- All safe state -->
        <div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-14 text-center">
            <div class="text-5xl mb-4 opacity-80">🎉</div>
            <div class="text-lg font-bold text-emerald-300 mb-1.5">Semua Filter dalam Kondisi Aman</div>
            <div class="text-sm text-slate-500">Tidak ada tangki yang membutuhkan maintenance dalam 30 hari ke depan.</div>
        </div>

    {:else}
        <!-- Notice cards grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {#each sortedNotice as rec}
                {@const isLate = rec.computed_status === 'JATUH TEMPO'}
                {@const picInfo = parsePicContact(rec)}
                <div class="group relative rounded-2xl border bg-[#0d1424] hover:bg-[#0f1929] transition-all duration-300 overflow-hidden {isLate ? 'border-rose-500/30' : 'border-amber-500/20'}">

                    <!-- Left accent bar -->
                    <div class="absolute left-0 top-0 bottom-0 w-[3px] {isLate ? 'bg-rose-500' : 'bg-amber-400'}"></div>

                    <!-- Glow blob -->
                    <div class="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-5 blur-xl {isLate ? 'bg-rose-500' : 'bg-amber-400'}"></div>

                    <div class="p-5 pl-6 space-y-4">

                        <!-- Header row -->
                        <div class="flex justify-between items-start gap-3">
                            <button
                                onclick={() => openDetailModal(rec.id)}
                                class="min-w-0 flex-1 text-left group/title"
                            >
                                <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{rec.group}</div>
                                <h3 class="text-[15px] font-bold text-white group-hover/title:text-sky-400 leading-snug truncate flex items-center gap-1.5">
                                    <span>{rec.estate}</span>
                                    <span class="text-[10px] text-sky-400 opacity-0 group-hover/title:opacity-100">🔍</span>
                                </h3>
                            </button>

                            <div class="shrink-0 {isLate
                                ? 'px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400'
                                : 'px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400'} text-[11px] font-black uppercase tracking-wide whitespace-nowrap">
                                {#if isLate}🚨 Lewat {Math.abs(rec.days_left)} hari
                                {:else}⚠️ {rec.days_left} hari lagi
                                {/if}
                            </div>
                        </div>

                        <!-- Detail grid -->
                        <div class="grid grid-cols-2 gap-2 text-xs bg-slate-900/50 rounded-xl p-3 border border-slate-800/60">
                            <div>
                                <div class="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Wilayah</div>
                                <div class="text-slate-300 font-medium truncate">{rec.region || 'Umum'}</div>
                            </div>
                            <div>
                                <div class="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Tipe Unit</div>
                                <div class="text-slate-300 font-medium truncate">{rec.unit_name || rec.tank_capacity || 'Tangki Timbun Solar'}</div>
                            </div>
                            <div class="col-span-2 pt-2 border-t border-slate-800/60">
                                <div class="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Equipment Filter</div>
                                <div class="text-sky-400 font-semibold">{rec.equipment}</div>
                            </div>
                            <div class="col-span-2 pt-2 border-t border-slate-800/60 flex justify-between items-center">
                                <div>
                                    <div class="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Target Servis</div>
                                    <div class="text-white font-bold text-sm">{rec.next_maintenance || '-'}</div>
                                </div>
                                {#if rec.install_date}
                                    <div class="text-right">
                                        <div class="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Install Awal</div>
                                        <div class="text-slate-400 font-medium text-[11px]">{rec.install_date}</div>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- PIC Info -->
                        <div class="flex items-center justify-between text-xs bg-slate-900/40 rounded-xl px-3 py-2.5 border border-slate-800/40">
                            <div>
                                <div class="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">PIC Konsumen</div>
                                <div class="text-slate-300 font-semibold">{rec.pic_manager || rec.pic_gudang || 'PIC Kebun'}</div>
                            </div>
                            {#if picInfo.hasPhone}
                                <div class="text-emerald-400 font-mono text-[11px]">📱 {picInfo.rawPhone || '+' + picInfo.phone}</div>
                            {:else if rec.phone_number}
                                <div class="text-emerald-400 font-mono text-[11px]">+{rec.phone_number}</div>
                            {/if}
                        </div>

                        <!-- Action buttons -->
                        <div class="flex gap-2 pt-1">
                            <!-- Detail button -->
                            <button
                                onclick={() => openDetailModal(rec.id)}
                                class="px-3 py-2.5 rounded-xl bg-indigo-600/50 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-200 hover:text-white text-[12px] font-bold text-center transition-all flex items-center justify-center gap-1 shrink-0"
                                title="Lihat riwayat lengkap & foto"
                            >
                                🔍 Detail
                            </button>

                            {#if picInfo.hasPhone}
                                <a
                                    href={buildWhatsAppUrl(rec)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/40 text-white text-[12px] font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                                    title="Kirim pesan WhatsApp ke {picInfo.name} ({picInfo.phone})"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                    <span>WA PIC</span>
                                </a>
                            {:else}
                                <a
                                    href={buildWhatsAppUrl(rec)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[12px] font-bold text-center transition-all flex items-center justify-center gap-1.5"
                                    title="Kirim pesan WhatsApp default"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                    <span>WA</span>
                                </a>
                            {/if}

                            <button
                                onclick={() => openServiceModal(rec)}
                                class="flex-1 py-2.5 rounded-xl bg-sky-600/70 hover:bg-sky-600 border border-sky-500/30 text-white text-[12px] font-bold text-center transition-all flex items-center justify-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                Ganti Filter
                            </button>
                        </div>

                    </div>
                </div>
            {/each}
        </div>
    {/if}

</div>

<ServiceModal
    record={selectedRecordForService}
    isOpen={isServiceModalOpen}
    onClose={closeServiceModal}
/>

<TankDetailModal
    tankId={selectedTankIdForDetail}
    isOpen={isDetailModalOpen}
    onClose={closeDetailModal}
    onOpenService={(rec) => {
        closeDetailModal();
        openServiceModal(rec);
    }}
/>
