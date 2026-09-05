<script>
    import { recordsStore, filterStockStore } from '$lib/stores/filterStore';
    import { notificationStore } from '$lib/stores/notificationStore';

    let { record = null, isOpen = false, onClose = () => {} } = $props();

    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let serviceDate    = $state(getTodayString());
    let intervalDays   = $state(90);
    let selectedFilterId = $state('');
    let notes          = $state('');
    let photoFile      = $state(null);   // File object (bukan base64)
    let photoPreview   = $state(null);   // Data URL untuk preview
    let photoFilename  = $state('');
    let isSaving       = $state(false);
    let saveError      = $state('');

    // Selected filter item dari daftar tipe filter
    let selectedStockItem = $derived(
        $filterStockStore.find(i => String(i.id) === String(selectedFilterId)) || null
    );

    let lastOpenRecordId = null;
    $effect(() => {
        if (isOpen && record && (lastOpenRecordId !== record.id)) {
            lastOpenRecordId = record.id;
            serviceDate    = getTodayString();
            intervalDays   = record.interval_days || record.interval_months || 90;
            notes          = '';
            photoFile      = null;
            photoPreview   = null;
            photoFilename  = '';
            saveError      = '';
            
            // Auto select matching filter item if available
            if ($filterStockStore.length > 0) {
                const found = $filterStockStore.find(i => 
                    record.equipment && record.equipment.toLowerCase().includes(i.filter_name.toLowerCase())
                );
                selectedFilterId = found ? String(found.id) : String($filterStockStore[0].id);
            }
        } else if (!isOpen) {
            lastOpenRecordId = null;
        }
    });

    function handleFileChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        photoFile     = file;
        photoFilename = file.name;

        // Hanya untuk preview di UI
        const reader  = new FileReader();
        reader.onload = (e) => { photoPreview = e.target.result; };
        reader.readAsDataURL(file);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!record || isSaving) return;

        isSaving  = true;
        saveError = '';

        try {
            // 1. Tipe filter baru yang dipilih
            const newEquipment = selectedStockItem ? selectedStockItem.filter_name : null;

            // 2. Catatan servis
            const notesWithFilter = selectedStockItem 
                ? (notes ? `[Filter: ${selectedStockItem.filter_name}] ${notes}` : `Pergantian filter element ${selectedStockItem.filter_name}`)
                : notes;

            await recordsStore.recordService(
                record.id,
                serviceDate,
                parseInt(intervalDays) || 90,
                notesWithFilter,
                photoFile,
                newEquipment
            );

            notificationStore.success(
                'Maintenance Berhasil Dicatat',
                `Servis unit ${record.estate} (${record.group}) berhasil diperbarui ke filter ${newEquipment || record.equipment}. Siklus jatuh tempo disetel ulang.`
            );

            onClose();
        } catch (err) {
            saveError = err?.message || 'Terjadi kesalahan saat menyimpan.';
        } finally {
            isSaving = false;
        }
    }
</script>

{#if isOpen && record}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
        <div class="bg-[#0d1424] border border-slate-700/60 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[96vh] sm:max-h-[94vh] flex flex-col shadow-2xl relative overflow-hidden text-left">

            <!-- Header -->
            <div class="p-3.5 sm:p-5 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center shrink-0">
                <div class="flex items-center gap-2.5 sm:gap-3">
                    <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-base sm:text-lg shrink-0">🛠️</span>
                    <div>
                        <h3 class="text-sm sm:text-base font-bold text-white leading-snug">Catat Maintenance & Upload Foto</h3>
                        <p class="text-[10px] sm:text-[11px] text-slate-400">Dokumentasi pergantian element filter & pembaruan siklus jatuh tempo</p>
                    </div>
                </div>
                <button 
                    onclick={onClose} 
                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm sm:text-base cursor-pointer"
                >
                    ✕
                </button>
            </div>

            <!-- Form Body (Landscape 2-Columns) -->
            <form onsubmit={handleSubmit} class="flex flex-col flex-1 overflow-hidden">
                <div class="p-3.5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

                    <!-- LEFT COLUMN (Form Fields 7/12) -->
                    <div class="lg:col-span-7 space-y-3.5">
                        
                        <!-- Unit Info Summary Box -->
                        <div class="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1">
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{record.group}</span>
                                <span class="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono">
                                    {record.equipment}
                                </span>
                            </div>
                            <div class="text-sm font-bold text-white leading-tight flex items-center gap-2">
                                <span>{record.estate}</span>
                                {#if record.location_type}
                                    <span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-sky-300 font-medium">{record.location_type}</span>
                                {/if}
                            </div>
                            <div class="text-[11px] text-slate-400">
                                Wilayah: <span class="text-slate-200">{record.region || 'Umum'}</span> | Unit: <span class="text-slate-200">{record.unit_name || record.tank_capacity || 'Tangki Solar'}</span>
                            </div>
                        </div>

                        <!-- Filter Sparepart Type Selection & Stock Status -->
                        <!-- Filter Sparepart Type Selection -->
                        <div>
                            <label for="filter-stock-select" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                Tipe Filter / Spare Part Digunakan *
                            </label>

                            <select
                                id="filter-stock-select"
                                bind:value={selectedFilterId}
                                class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-medium"
                            >
                                {#if $filterStockStore.length === 0}
                                    <option value="">(Belum ada data tipe filter di sistem)</option>
                                {:else}
                                    {#each $filterStockStore as item}
                                        <option value={String(item.id)}>
                                            {item.filter_name}
                                        </option>
                                    {/each}
                                {/if}
                            </select>
                        </div>

                        <!-- Date & Interval (Side-by-Side) -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label for="service-date" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                    Tanggal Servis / Ganti *
                                </label>
                                <input
                                    type="date"
                                    id="service-date"
                                    bind:value={serviceDate}
                                    required
                                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                                />
                            </div>

                            <div>
                                <label for="interval-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                    Interval Maintenance (Hari) *
                                </label>
                                <div class="relative">
                                    <input
                                        type="number"
                                        id="interval-input"
                                        bind:value={intervalDays}
                                        min="1"
                                        max="365"
                                        required
                                        placeholder="Contoh: 90"
                                        class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium pr-14"
                                    />
                                    <span class="absolute right-3 top-2 text-xs text-slate-500 pointer-events-none font-semibold">Hari</span>
                                </div>
                                <span class="text-[10px] text-slate-500 mt-1 block">Ketik jumlah hari interval maintenance rutin (misal: 30, 60, 90 hari)</span>
                            </div>
                        </div>

                        <!-- Notes -->
                        <div>
                            <label for="notes" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                                Catatan Servis (Opsional)
                            </label>
                            <input
                                type="text"
                                id="notes"
                                bind:value={notes}
                                placeholder="Contoh: Element filter diganti baru, kondisi tabung bersih..."
                                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                        </div>

                        {#if saveError}
                            <div class="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-300">
                                ⚠️ {saveError}
                            </div>
                        {/if}

                    </div>

                    <!-- RIGHT COLUMN (Photo Upload & Preview 5/12) -->
                    <div class="lg:col-span-5 flex flex-col">
                        <label for="photo-upload" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Foto Pergantian Filter</span>
                            <span class="text-sky-400 font-normal text-[10px]">📁 Disimpan ke Directory</span>
                        </label>

                        <div class="flex-1 flex flex-col min-h-[220px] rounded-2xl border-2 border-dashed border-slate-800 hover:border-sky-500/50 transition-all bg-slate-950/60 p-3 relative group overflow-hidden">
                            <input
                                type="file"
                                id="photo-upload"
                                accept="image/*"
                                onchange={handleFileChange}
                                class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />

                            {#if photoPreview}
                                <div class="flex-1 flex flex-col items-center justify-center relative w-full h-full">
                                    <img 
                                        src={photoPreview} 
                                        alt="Preview" 
                                        class="w-full h-44 object-cover rounded-xl border border-slate-700 shadow-md"
                                    />
                                    <div class="w-full mt-2 flex items-center justify-between text-left px-1">
                                        <div class="min-w-0 flex-1">
                                            <div class="text-[11px] font-bold text-emerald-400 flex items-center gap-1 truncate">
                                                <span>✓</span> {photoFilename}
                                            </div>
                                            <div class="text-[10px] text-slate-500">Klik untuk mengganti foto</div>
                                        </div>
                                        <button
                                            type="button"
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                photoFile = null;
                                                photoPreview = null;
                                                photoFilename = '';
                                            }}
                                            class="z-20 text-[10px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            {:else}
                                <div class="flex-1 flex flex-col items-center justify-center text-center p-4">
                                    <div class="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-sky-500/40 flex items-center justify-center text-2xl mb-2 transition-colors">
                                        📷
                                    </div>
                                    <div class="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                                        Upload Foto Servis Filter
                                    </div>
                                    <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                        Foto fisik filter saat/setelah servis di lokasi unit.
                                    </p>
                                    <span class="mt-3 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                                        JPG, PNG (Maks 10MB)
                                    </span>
                                </div>
                            {/if}
                        </div>

                        <div class="mt-2 text-[10px] text-slate-500 px-1 truncate">
                            Target Directory: <span class="font-mono text-cyan-400">/uploads/{record.group}/{record.region || 'Umum'}/{record.estate}/</span>
                        </div>
                    </div>

                </div>

                <!-- Modal Footer Bar -->
                <div class="p-3.5 sm:px-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
                    <div class="text-[11px] text-slate-500 hidden sm:block">
                        * Tanggal jatuh tempo berikutnya akan dihitung otomatis sesuai interval.
                    </div>
                    <div class="flex items-center gap-2.5 ml-auto">
                        <button
                            type="button"
                            onclick={onClose}
                            disabled={isSaving}
                            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            class="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                            {#if isSaving}
                                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                <span>Menyimpan Servis...</span>
                            {:else}
                                <span>💾 Simpan Perubahan & Servis</span>
                            {/if}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    </div>
{/if}

