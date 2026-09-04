<script>
    import { page } from '$app/state';
    import { recordsStore, groupsStore } from '$lib/stores/filterStore';
    import ServiceModal from '$lib/components/ServiceModal.svelte';
    import TankDetailModal from '$lib/components/TankDetailModal.svelte';
    import { exportToExcel, exportToPDF } from '$lib/utils/exportUtils.js';
    import { buildWhatsAppUrl, parsePicContact } from '$lib/utils/whatsappHelper.js';

    let isExportingExcel = $state(false);
    let isExportingPDF   = $state(false);

    // Build filter label for file names / export headers
    function buildFilterLabel() {
        const parts = [];
        if (selectedGroup  !== 'ALL') parts.push(selectedGroup);
        if (selectedStatus !== 'ALL') parts.push(selectedStatus);
        if (searchTerm.trim())        parts.push(`"${searchTerm.trim()}"`);
        return parts.join(' · ');
    }

    async function handleExportExcel() {
        if (isExportingExcel) return;
        isExportingExcel = true;
        try {
            await exportToExcel(filteredRecords, buildFilterLabel());
        } finally {
            isExportingExcel = false;
        }
    }

    async function handleExportPDF() {
        if (isExportingPDF) return;
        isExportingPDF = true;
        try {
            await exportToPDF(filteredRecords, buildFilterLabel());
        } finally {
            isExportingPDF = false;
        }
    }

    let searchTerm     = $state('');
    let selectedGroup  = $state(page.url.searchParams.get('group') || 'ALL');
    let selectedStatus = $state('ALL');

    let selectedRecordForService = $state(null);
    let isServiceModalOpen       = $state(false);

    let selectedTankIdForDetail  = $state(null);
    let isDetailModalOpen        = $state(false);

    let filteredRecords = $derived($recordsStore.filter(r => {
        if (selectedGroup  !== 'ALL' && r.group            !== selectedGroup)  return false;
        if (selectedStatus !== 'ALL' && r.computed_status  !== selectedStatus) return false;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            const match =
                (r.estate       && r.estate.toLowerCase().includes(s))       ||
                (r.group        && r.group.toLowerCase().includes(s))        ||
                (r.region       && r.region.toLowerCase().includes(s))       ||
                (r.pic_manager  && r.pic_manager.toLowerCase().includes(s))  ||
                (r.pic_gudang   && r.pic_gudang.toLowerCase().includes(s))   ||
                (r.phone_number && r.phone_number.includes(s))               ||
                (r.equipment    && r.equipment.toLowerCase().includes(s));
            if (!match) return false;
        }
        return true;
    }));

    function openServiceModal(record) {
        selectedRecordForService = record;
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

    const statusConfig = {
        'JATUH TEMPO': { label: 'Jatuh Tempo', color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/25'  },
        'NOTICE':      { label: 'Notice',       color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25' },
        'AMAN':        { label: 'Aman',         color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
        'NON-AKTIF':   { label: 'Non-Aktif',    color: 'text-slate-400',   bg: 'bg-slate-800/60',   border: 'border-slate-700/50' },
    };
</script>

<div class="space-y-6 animate-fadeIn">

    <!-- Page Header -->
    <div class="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-base">📋</span>
                Data Unit & Filter
            </h2>
            <p class="text-[13px] text-slate-500 mt-1.5 ml-[42px]">
                Seluruh unit operasional dari Group Perusahaan Konsumen beserta riwayat pemasangan & maintenance.
            </p>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
            <!-- Jumlah tampil -->
            <div class="text-sm text-slate-500">
                Menampilkan
                <span class="font-bold text-sky-400 text-base mx-1">{filteredRecords.length}</span>
                {#if filteredRecords.length !== $recordsStore.length}
                    dari <span class="font-semibold text-white">{$recordsStore.length}</span>
                {/if}
                unit
            </div>

            <!-- Export Excel -->
            <button
                id="btn-export-excel"
                onclick={handleExportExcel}
                disabled={isExportingExcel || filteredRecords.length === 0}
                class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                       bg-emerald-500/10 border border-emerald-500/30 text-emerald-400
                       hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:text-emerald-300
                       disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                title="Export ke Excel (.xlsx) — {filteredRecords.length} unit"
            >
                {#if isExportingExcel}
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Mengekspor...
                {:else}
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export Excel
                {/if}
            </button>

            <!-- Export PDF -->
            <button
                id="btn-export-pdf"
                onclick={handleExportPDF}
                disabled={isExportingPDF || filteredRecords.length === 0}
                class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                       bg-rose-500/10 border border-rose-500/30 text-rose-400
                       hover:bg-rose-500/20 hover:border-rose-400/50 hover:text-rose-300
                       disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                title="Export ke PDF — {filteredRecords.length} unit"
            >
                {#if isExportingPDF}
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Mengekspor...
                {:else}
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    Export PDF
                {/if}
            </button>
        </div>
    </div>

    <!-- Filter Controls -->
    <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Search -->
            <div class="relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                    type="text"
                    bind:value={searchTerm}
                    placeholder="Cari kebun, wilayah, PIC, nomor HP..."
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 transition-colors"
                />
            </div>

            <!-- Group filter -->
            <select
                bind:value={selectedGroup}
                class="py-2.5 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-sky-500/60 transition-colors"
            >
                <option value="ALL">🏢 Semua Group Perusahaan</option>
                {#if $groupsStore.length > 0}
                    {#each $groupsStore as g}
                        <option value={g.name}>{g.name}</option>
                    {/each}
                {:else}
                    <option value="CBI Group">CBI Group</option>
                    <option value="Genting Group">Genting Group</option>
                    <option value="Gunas Group">Gunas Group</option>
                    <option value="Palmdale">Palmdale</option>
                    <option value="TSH Group">TSH Group</option>
                    <option value="Wilmar Group">Wilmar Group</option>
                {/if}
            </select>

            <!-- Status filter -->
            <select
                bind:value={selectedStatus}
                class="py-2.5 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-sky-500/60 transition-colors"
            >
                <option value="ALL">📌 Semua Status</option>
                <option value="NOTICE">⚠️ Notice (1–30 Hari)</option>
                <option value="JATUH TEMPO">🚨 Jatuh Tempo</option>
                <option value="AMAN">✅ Status Aman</option>
                <option value="NON-AKTIF">⚪ Non-Aktif</option>
            </select>
        </div>
    </div>

    <!-- Table -->
    {#if $recordsStore.length === 0}
        <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-16 text-center">
            <div class="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-3xl mx-auto mb-4 opacity-50">🛢️</div>
            <div class="text-base font-semibold text-slate-300 mb-1">Belum ada data</div>
            <div class="text-sm text-slate-500">Import seed.sql ke database MySQL terlebih dahulu.</div>
        </div>
    {:else if filteredRecords.length === 0}
        <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-12 text-center">
            <div class="text-3xl mb-3 opacity-40">🔍</div>
            <div class="text-sm font-semibold text-slate-300 mb-1">Tidak ada hasil</div>
            <div class="text-xs text-slate-500">Coba ubah kata kunci atau filter yang dipilih.</div>
        </div>
    {:else}
        <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] overflow-hidden shadow-2xl">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800/80" style="background: rgba(8,12,20,0.7);">
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Status</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Kebun / Estate</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Wilayah</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Nama / Tipe Unit</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Equipment Filter</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Servis Berikutnya</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Kontak PIC</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredRecords as r, i}
                            {@const cfg = statusConfig[r.computed_status] ?? statusConfig['AMAN']}
                            {@const picInfo = parsePicContact(r)}
                            <tr class="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">

                                <!-- Status badge -->
                                <td class="py-3 px-4 whitespace-nowrap">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg {cfg.bg} border {cfg.border} {cfg.color} text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                                        {#if r.computed_status === 'JATUH TEMPO'}
                                            🚨 Lewat {Math.abs(r.days_left)}h
                                        {:else if r.computed_status === 'NOTICE'}
                                            ⚠️ Sisa {r.days_left}h
                                        {:else if r.computed_status === 'NON-AKTIF'}
                                            ⚪ Non-Aktif
                                        {:else}
                                            ✅ Sisa {r.days_left}h
                                        {/if}
                                    </span>
                                </td>

                                <!-- Estate & Group (Clickable to open Detail Modal) -->
                                <td class="py-3 px-4">
                                    <button
                                        onclick={() => openDetailModal(r.id)}
                                        class="text-left group/estate flex flex-col hover:opacity-90"
                                    >
                                        <div class="text-[13px] font-bold text-white group-hover/estate:text-sky-400 transition-colors leading-tight flex items-center gap-1.5">
                                            <span>{r.estate}</span>
                                            <span class="text-[10px] opacity-0 group-hover/estate:opacity-100 text-sky-400">🔍</span>
                                        </div>
                                        <div class="text-[11px] text-slate-500 mt-0.5">{r.group}</div>
                                    </button>
                                </td>

                                <!-- Region -->
                                <td class="py-3 px-4 text-[13px] text-slate-400 whitespace-nowrap">
                                    {r.region || '—'}
                                </td>

                                <!-- Unit Name / Type -->
                                <td class="py-3 px-4 whitespace-nowrap">
                                    <div class="text-[13px] text-slate-300 font-medium">{r.unit_name || r.tank_capacity || 'Tangki Timbun Solar'}</div>
                                    {#if r.sisa_solar && r.sisa_solar !== '-'}
                                        <div class="text-[10px] text-cyan-400 mt-0.5">Sisa: {r.sisa_solar}</div>
                                    {/if}
                                </td>

                                <!-- Equipment -->
                                <td class="py-3 px-4">
                                    <div class="text-[13px] font-semibold text-sky-400 whitespace-nowrap">{r.equipment}</div>
                                </td>

                                <!-- Next maintenance -->
                                <td class="py-3 px-4 whitespace-nowrap">
                                    <div class="text-[13px] font-bold text-white">{r.next_maintenance || '—'}</div>
                                    <div class="text-[10px] text-slate-600 mt-0.5">Install: {r.install_date || r.last_maintenance || '—'}</div>
                                </td>

                                <!-- PIC -->
                                <td class="py-3 px-4">
                                    <div class="text-[13px] text-slate-300 font-medium">{picInfo.name}</div>
                                    {#if picInfo.hasPhone}
                                        <div class="text-[11px] text-emerald-400 font-mono mt-0.5">📱 {picInfo.rawPhone || '+' + picInfo.phone}</div>
                                    {/if}
                                </td>

                                <!-- Actions -->
                                <td class="py-3 px-4">
                                    <div class="flex items-center gap-1.5">
                                        <!-- Detail Button -->
                                        <button
                                            onclick={() => openDetailModal(r.id)}
                                            class="px-2.5 py-1.5 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-200 hover:text-white font-bold text-[11px] transition-all whitespace-nowrap"
                                            title="Lihat riwayat kronologis & foto detail"
                                        >
                                            🔍 Detail
                                        </button>

                                        <!-- WhatsApp Button -->
                                        <a
                                            href={buildWhatsAppUrl(r)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="px-2.5 py-1.5 rounded-lg {picInfo.hasPhone ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'} border border-emerald-500/30 font-bold text-[11px] transition-all whitespace-nowrap flex items-center gap-1"
                                            title={picInfo.hasPhone ? `Kirim WhatsApp ke ${picInfo.name} (${picInfo.phone})` : 'Kirim WhatsApp'}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                            </svg>
                                            WA
                                        </a>
                                        {#if r.computed_status === 'NON-AKTIF'}
                                            <button
                                                onclick={() => openDetailModal(r.id)}
                                                class="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 hover:text-white font-bold text-[11px] transition-all whitespace-nowrap flex items-center gap-1"
                                                title="Aktifkan kembali unit tangki (perlu PIN)"
                                            >
                                                ⚡ Aktifkan
                                            </button>
                                        {:else}
                                            <button
                                                onclick={() => openServiceModal(r)}
                                                class="px-2.5 py-1.5 rounded-lg bg-sky-600/60 hover:bg-sky-600 border border-sky-500/30 text-white font-bold text-[11px] transition-all whitespace-nowrap"
                                            >
                                                🛠️ Servis
                                            </button>
                                        {/if}

                                        <!-- Delete button -->
                                        <button
                                            onclick={() => {
                                                if (confirm(`Yakin ingin menghapus unit tangki ${r.estate} (${r.group})? Seluruh riwayat dan foto terkait akan dihapus.`)) {
                                                    recordsStore.deleteTank(r.id);
                                                }
                                            }}
                                            class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-xs"
                                            title="Hapus unit tangki"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Table footer -->
            <div class="px-5 py-3 border-t border-slate-800/60 flex justify-between items-center" style="background: rgba(8,12,20,0.5);">
                <span class="text-xs text-slate-600">
                    Menampilkan {filteredRecords.length} dari {$recordsStore.length} unit tangki
                </span>
                <span class="text-[10px] text-slate-700 font-mono">
                    {new Date().toLocaleDateString('id-ID')}
                </span>
            </div>
        </div>
    {/if}

</div>

<!-- Modal Servis Maintenance -->
<ServiceModal
    record={selectedRecordForService}
    isOpen={isServiceModalOpen}
    onClose={closeServiceModal}
/>

<!-- Modal Detail Lengkap Riwayat & Foto Tangki -->
<TankDetailModal
    tankId={selectedTankIdForDetail}
    isOpen={isDetailModalOpen}
    onClose={closeDetailModal}
    onOpenService={(rec) => {
        closeDetailModal();
        openServiceModal(rec);
    }}
/>
