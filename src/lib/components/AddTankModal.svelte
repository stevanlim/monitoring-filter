<script>
    import { recordsStore, groupsStore, filterStockStore } from '$lib/stores/filterStore';
    import { notificationStore } from '$lib/stores/notificationStore';

    let { isOpen = false, onClose = () => {} } = $props();

    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let group = $state('CBI Group');
    let estate = $state('');
    let region = $state('');
    let unitName = $state('Tangki Timbun Solar');
    let selectedFilterId = $state('');
    let equipment = $state('MDF 250-1');
    let installDate = $state(getTodayString());
    let intervalMonths = $state(3);
    let picManager = $state('');
    let notes = $state('');

    // Photo state
    let photoFile = $state(null);
    let photoPreview = $state(null);
    let photoFilename = $state('');

    let isSaving = $state(false);
    let formError = $state('');

    // Selected filter stock item
    let selectedStockItem = $derived(
        $filterStockStore.find(i => String(i.id) === String(selectedFilterId)) || null
    );
    let isStockDepleted = $derived(selectedStockItem ? selectedStockItem.quantity <= 0 : false);
    let isStockLow = $derived(
        selectedStockItem ? selectedStockItem.quantity > 0 && selectedStockItem.quantity <= selectedStockItem.min_quantity : false
    );

    $effect(() => {
        if (isOpen && $filterStockStore.length > 0 && !selectedFilterId) {
            selectedFilterId = String($filterStockStore[0].id);
            equipment = $filterStockStore[0].filter_name;
        }
    });

    function handleFilterSelect(e) {
        selectedFilterId = e.target.value;
        const found = $filterStockStore.find(i => String(i.id) === String(selectedFilterId));
        if (found) equipment = found.filter_name;
    }

    function handlePhotoChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        photoFile = file;
        photoFilename = file.name;

        const reader = new FileReader();
        reader.onload = (ev) => {
            photoPreview = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (isSaving) return;

        if (isStockDepleted) {
            formError = `Stok untuk filter "${selectedStockItem?.filter_name}" sudah habis (0 pcs). Pemasangan tidak dapat dilakukan sebelum stok diisi kembali di menu Kelola Data Filter.`;
            return;
        }

        isSaving = true;
        formError = '';

        try {
            // 1. Kurangi stok di filterStockStore jika ada filter yang dipilih
            if (selectedStockItem && selectedStockItem.id) {
                await filterStockStore.adjustQuantity(selectedStockItem.id, -1);
            }

            // 2. Simpan record tangki
            await recordsStore.addTank({
                group,
                estate: estate.trim(),
                region: region.trim() || 'Umum',
                unit_name: unitName.trim() || 'Tangki Timbun Solar',
                tank_capacity: unitName.trim() || 'Tangki Timbun Solar',
                equipment: (equipment || selectedStockItem?.filter_name || 'MicroClean Filter').trim(),
                install_date: installDate,
                last_maintenance: installDate,
                interval_months: parseInt(intervalMonths),
                pic_manager: picManager.trim(),
                notes: notes.trim()
            }, photoFile);

            notificationStore.success(
                'Unit Berhasil Dipasang',
                `Pemasangan filter di ${estate.trim()} (${group}) berhasil disimpan. Stok dipotong (-1).`
            );

            // Reset form & close
            estate = '';
            region = '';
            picManager = '';
            notes = '';
            photoFile = null;
            photoPreview = null;
            photoFilename = '';
            onClose();
        } catch (err) {
            formError = err?.message || 'Gagal menyimpan unit tangki';
        } finally {
            isSaving = false;
        }
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
        <div class="bg-[#0d1424] border border-slate-700/60 rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl relative overflow-hidden text-left">
            
            <!-- Modal Header -->
            <div class="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center shrink-0">
                <div class="flex items-center gap-3">
                    <span class="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-lg shrink-0">➕</span>
                    <div>
                        <h3 class="text-base font-bold text-white leading-snug">Tambah Pemasangan Filter Baru</h3>
                        <p class="text-[11px] text-slate-400">Pencatatan awal pemasangan unit filter & foto dokumentasi fisik</p>
                    </div>
                </div>
                <button 
                    onclick={onClose} 
                    class="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-base"
                >
                    ✕
                </button>
            </div>

            <!-- Modal Body (Landscape 2-Columns) -->
            <form onsubmit={handleSubmit} class="flex flex-col flex-1 overflow-hidden">
                <div class="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    <!-- LEFT COLUMN (Form Data 7/12) -->
                    <div class="lg:col-span-7 space-y-3.5">
                        
                        <!-- Group & Wilayah -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label for="group-select" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Group Perusahaan *</label>
                                <select 
                                    id="group-select" 
                                    bind:value={group}
                                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                                >
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
                            </div>

                            <div>
                                <label for="region-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Wilayah / Regional *</label>
                                <input 
                                    type="text" 
                                    id="region-input" 
                                    bind:value={region}
                                    required
                                    placeholder="Contoh: Kalbar / Kaltim"
                                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                                />
                            </div>
                        </div>

                        <!-- Estate & Nama Unit -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label for="estate-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Kebun / Estate / PT *</label>
                                <input 
                                    type="text" 
                                    id="estate-input" 
                                    bind:value={estate}
                                    required
                                    placeholder="Contoh: MJP I, BPK Estate"
                                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                                />
                            </div>

                            <div>
                                <label for="unit-name-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Nama / Tipe Unit *</label>
                                <input 
                                    type="text" 
                                    id="unit-name-input" 
                                    bind:value={unitName}
                                    required
                                    placeholder="Contoh: Tangki Timbun Solar"
                                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                                />
                            </div>
                        </div>

                        <!-- Model Filter & Stock Selection -->
                        <div>
                            <label for="equipment-select" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex justify-between items-center">
                                <span>Tipe Filter Terpasang *</span>
                                {#if selectedStockItem}
                                    <span class="text-[11px] font-mono font-bold {isStockDepleted ? 'text-rose-400' : isStockLow ? 'text-amber-400' : 'text-emerald-400'}">
                                        Stok: {selectedStockItem.quantity} pcs {isStockDepleted ? '(HABIS ❌)' : ''}
                                    </span>
                                {/if}
                            </label>
                            
                            <select
                                id="equipment-select"
                                value={selectedFilterId}
                                onchange={handleFilterSelect}
                                class="w-full bg-slate-950 border {isStockDepleted ? 'border-rose-500/60 text-rose-300' : 'border-slate-800 text-white'} rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-medium"
                            >
                                {#if $filterStockStore.length === 0}
                                    <option value="">(Belum ada data tipe filter di sistem)</option>
                                {:else}
                                    {#each $filterStockStore as item}
                                        <option value={String(item.id)}>
                                            {item.filter_name} — (Sisa: {item.quantity} pcs {item.quantity === 0 ? '❌ HABIS' : item.quantity <= item.min_quantity ? '⚠️ MENIPIS' : '✅'})
                                        </option>
                                    {/each}
                                {/if}
                            </select>
                        </div>

                        <!-- Stock Warnings -->
                        {#if isStockDepleted}
                            <div class="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                                <span class="text-sm">🚫</span>
                                <span class="text-[11px]"><b>Stok filter habis (0 pcs).</b> Tambahkan stok di menu Kelola Data Filter sebelum menyimpan.</span>
                            </div>
                        {:else if isStockLow}
                            <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] flex items-center gap-2">
                                <span>⚠️</span>
                                <span>Peringatan: Stok filter ini tersisa <b>{selectedStockItem?.quantity} pcs</b>.</span>
                            </div>
                        {/if}

                        <!-- Tanggal Pasang & Interval Servis -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label for="install-date-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Tanggal Pasang Awal *</label>
                                <input 
                                    type="date" 
                                    id="install-date-input" 
                                    bind:value={installDate}
                                    required
                                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                                />
                            </div>

                            <div>
                                <label for="interval-select" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Interval Maintenance *</label>
                                <select 
                                    id="interval-select" 
                                    bind:value={intervalMonths}
                                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                                >
                                    <option value={3}>3 Bulan (90 Hari)</option>
                                    <option value={4}>4 Bulan (120 Hari)</option>
                                    <option value={6}>6 Bulan (180 Hari)</option>
                                </select>
                            </div>
                        </div>

                        <!-- PIC Info -->
                        <div>
                            <label for="pic-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Kontak PIC Konsumen / Gudang</label>
                            <input 
                                type="text" 
                                id="pic-input" 
                                bind:value={picManager}
                                placeholder="Contoh: Hendra (082149582789)"
                                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                            />
                        </div>

                        <!-- Catatan -->
                        <div>
                            <label for="notes-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Catatan Pemasangan (Opsional)</label>
                            <input 
                                type="text"
                                id="notes-input" 
                                bind:value={notes}
                                placeholder="Contoh: Unit baru filter dipasang pada jalur pompa utama..."
                                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                        </div>

                        {#if formError}
                            <div class="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-300">
                                ⚠️ {formError}
                            </div>
                        {/if}

                    </div>

                    <!-- RIGHT COLUMN (Foto Dokumentasi 5/12) -->
                    <div class="lg:col-span-5 flex flex-col">
                        <label for="install-photo-upload" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Foto Dokumentasi Unit</span>
                            <span class="text-sky-400 font-normal text-[10px]">📁 Disimpan ke Directory</span>
                        </label>

                        <div class="flex-1 flex flex-col min-h-[220px] rounded-2xl border-2 border-dashed border-slate-800 hover:border-sky-500/50 transition-all bg-slate-950/60 p-3 relative group overflow-hidden">
                            <input 
                                type="file" 
                                id="install-photo-upload"
                                accept="image/*"
                                onchange={handlePhotoChange}
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
                                        Upload Foto Pemasangan
                                    </div>
                                    <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                        Drag & drop atau klik untuk memilih file foto fisik unit di lokasi.
                                    </p>
                                    <span class="mt-3 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                                        JPG, PNG (Maks 10MB)
                                    </span>
                                </div>
                            {/if}
                        </div>

                        <div class="mt-2 text-[10px] text-slate-500 px-1 truncate">
                            Target Directory: <span class="font-mono text-cyan-400">/uploads/{group || 'Group'}/{region || 'Wilayah'}/{estate || 'Estate'}/</span>
                        </div>
                    </div>

                </div>

                <!-- Modal Footer Bar -->
                <div class="p-3.5 sm:px-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
                    <div class="text-[11px] text-slate-500 hidden sm:block">
                        * Data akan otomatis memperbarui siklus maintenance & riwayat unit.
                    </div>
                    <div class="flex items-center gap-2.5 ml-auto">
                        <button 
                            type="button" 
                            onclick={onClose}
                            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving || isStockDepleted}
                            class="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
                            title={isStockDepleted ? 'Stok filter habis, tidak dapat menyimpan pemasangan' : ''}
                        >
                            {#if isSaving}
                                <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                <span>Menyimpan...</span>
                            {:else if isStockDepleted}
                                <span>🚫 Stok Habis</span>
                            {:else}
                                <span>💾 Simpan & Potong Stok (-1)</span>
                            {/if}
                        </button>
                    </div>
                </div>
            </form>

        </div>
    </div>
{/if}
