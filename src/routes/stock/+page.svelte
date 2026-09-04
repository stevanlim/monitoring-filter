<script>
    import { filterStockStore, stockAlertStore } from '$lib/stores/filterStore';
    import { notificationStore } from '$lib/stores/notificationStore';

    let searchTerm = $state('');
    let filterStatus = $state('ALL'); // 'ALL' | 'HABIS' | 'MENIPIS' | 'CUKUP'

    // Modals
    let showAddModal = $state(false);
    let showEditModal = $state(false);
    let showAdjustModal = $state(false);
    let showDeleteModal = $state(false);

    let activeItem = $state(null);

    // Form data
    let formName = $state('');
    let formQuantity = $state(0);
    let formMinQuantity = $state(3);
    let formNotes = $state('');
    let adjustAmount = $state(1);
    let adjustType = $state('add'); // 'add' | 'sub'
    let formPin = $state('');

    let isSubmitting = $state(false);
    let errorMessage = $state('');

    let filteredStock = $derived($filterStockStore.filter(item => {
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            const match = (item.filter_name && item.filter_name.toLowerCase().includes(s)) ||
                          (item.notes && item.notes.toLowerCase().includes(s));
            if (!match) return false;
        }
        if (filterStatus === 'HABIS' && item.quantity > 0) return false;
        if (filterStatus === 'MENIPIS' && (item.quantity === 0 || item.quantity > item.min_quantity)) return false;
        if (filterStatus === 'CUKUP' && item.quantity <= item.min_quantity) return false;
        return true;
    }));

    let totalQuantity = $derived($filterStockStore.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0));

    function openAddModal() {
        formName = '';
        formQuantity = 10;
        formMinQuantity = 3;
        formNotes = '';
        errorMessage = '';
        showAddModal = true;
    }

    function openEditModal(item) {
        activeItem = item;
        formName = item.filter_name;
        formQuantity = item.quantity;
        formMinQuantity = item.min_quantity;
        formNotes = item.notes || '';
        errorMessage = '';
        showEditModal = true;
    }

    function openAdjustModal(item, type = 'add') {
        activeItem = item;
        adjustType = type;
        adjustAmount = 1;
        formPin = '';
        errorMessage = '';
        showAdjustModal = true;
    }

    function openDeleteModal(item) {
        activeItem = item;
        errorMessage = '';
        showDeleteModal = true;
    }

    async function handleAddSubmit(e) {
        e.preventDefault();
        if (isSubmitting) return;
        if (!formName.trim()) {
            errorMessage = 'Nama tipe filter wajib diisi';
            return;
        }

        isSubmitting = true;
        errorMessage = '';
        const res = await filterStockStore.addItem({
            filter_name: formName.trim(),
            quantity: Number(formQuantity),
            min_quantity: Number(formMinQuantity),
            notes: formNotes.trim()
        });
        isSubmitting = false;

        if (res.success) {
            notificationStore.success('Tipe Filter Ditambahkan', `Tipe filter "${formName.trim()}" berhasil ditambahkan.`);
            showAddModal = false;
        } else {
            errorMessage = res.error;
        }
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        if (isSubmitting || !activeItem) return;
        if (!formName.trim()) {
            errorMessage = 'Nama tipe filter wajib diisi';
            return;
        }

        isSubmitting = true;
        errorMessage = '';
        const res = await filterStockStore.editItem(activeItem.id, {
            filter_name: formName.trim(),
            quantity: Number(formQuantity),
            min_quantity: Number(formMinQuantity),
            notes: formNotes.trim()
        });
        isSubmitting = false;

        if (res.success) {
            notificationStore.success('Tipe Filter Diperbarui', `Perubahan data "${formName.trim()}" berhasil disimpan.`);
            showEditModal = false;
            activeItem = null;
        } else {
            errorMessage = res.error;
        }
    }

    async function handleAdjustSubmit(e) {
        e.preventDefault();
        if (isSubmitting || !activeItem) return;

        if (!formPin || formPin.trim().length !== 6) {
            errorMessage = 'PIN Keamanan harus terdiri dari 6 digit angka!';
            return;
        }

        isSubmitting = true;
        errorMessage = '';

        try {
            // Verifikasi PIN Keamanan terlebih dahulu
            const verifyRes = await fetch('/api/auth/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: formPin.trim() })
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.valid) {
                errorMessage = verifyData.error || 'PIN Keamanan salah! Otorisasi ditolak.';
                isSubmitting = false;
                return;
            }

            const delta = adjustType === 'add' ? Number(adjustAmount) : -Number(adjustAmount);
            const res = await filterStockStore.adjustQuantity(activeItem.id, delta);

            if (res.success) {
                notificationStore.success(
                    'Stok Berhasil Diperbarui',
                    `Stok ${activeItem.filter_name} berhasil ${adjustType === 'add' ? 'ditambah' : 'dikurangi'} ${adjustAmount} pcs.`
                );
                showAdjustModal = false;
                activeItem = null;
                formPin = '';
            } else {
                errorMessage = res.error;
            }
        } catch (err) {
            errorMessage = 'Gagal memproses otorisasi perubahan stok.';
        } finally {
            isSubmitting = false;
        }
    }

    async function handleDeleteSubmit() {
        if (isSubmitting || !activeItem) return;
        isSubmitting = true;
        errorMessage = '';
        const res = await filterStockStore.deleteItem(activeItem.id);
        isSubmitting = false;

        if (res.success) {
            showDeleteModal = false;
            activeItem = null;
        } else {
            errorMessage = res.error;
        }
    }
</script>

<svelte:head>
    <title>Kelola Data Filter & Stok — PT. Anugerah Rezeki Teknindo</title>
</svelte:head>

<div class="space-y-6 animate-fadeIn pb-12">

    <!-- Header Section -->
    <div class="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-base">📦</span>
                Kelola Data & Stok Filter
            </h2>
            <p class="text-[13px] text-slate-400 mt-1.5 ml-[42px]">
                Katalog tipe filter (MDF 250-1, MDF 250-516, FEC 250, dll) dan manajemen kuota stok real-time.
            </p>
        </div>

        <button
            onclick={openAddModal}
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition-all active:scale-95"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Tambah Tipe Filter
        </button>
    </div>

    <!-- KPI Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Tipe -->
        <div class="rounded-2xl border border-slate-800/80 bg-[#0D1424]/90 p-4 relative overflow-hidden">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tipe Filter</div>
            <div class="text-2xl font-black text-white mt-1">{$filterStockStore.length} <span class="text-xs text-slate-500 font-normal">tipe</span></div>
            <div class="text-[11px] text-slate-500 mt-1">Katalog elemen & unit terdaftar</div>
            <div class="absolute -right-2 -bottom-2 text-4xl opacity-10">📋</div>
        </div>

        <!-- Total Stok Fisik -->
        <div class="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 relative overflow-hidden">
            <div class="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Total Stok Tersedia</div>
            <div class="text-2xl font-black text-sky-300 mt-1">{totalQuantity} <span class="text-xs text-sky-400/70 font-normal">pcs</span></div>
            <div class="text-[11px] text-sky-400/60 mt-1">Total akumulasi seluruh unit</div>
            <div class="absolute -right-2 -bottom-2 text-4xl opacity-10">📦</div>
        </div>

        <!-- Stok Menipis -->
        <div class="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 relative overflow-hidden">
            <div class="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Stok Menipis (Notice)</div>
            <div class="text-2xl font-black text-amber-300 mt-1">{$stockAlertStore.menipis} <span class="text-xs text-amber-400/70 font-normal">tipe</span></div>
            <div class="text-[11px] text-amber-400/60 mt-1">Stok &le; batas minimum</div>
            <div class="absolute -right-2 -bottom-2 text-4xl opacity-10">⚠️</div>
        </div>

        <!-- Stok Habis -->
        <div class="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 relative overflow-hidden">
            <div class="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Stok Habis (0 Pcs)</div>
            <div class="text-2xl font-black text-rose-300 mt-1">{$stockAlertStore.habis} <span class="text-xs text-rose-400/70 font-normal">tipe</span></div>
            <div class="text-[11px] text-rose-400/60 mt-1">Tidak dapat digunakan untuk servis/pasang</div>
            <div class="absolute -right-2 -bottom-2 text-4xl opacity-10">🚨</div>
        </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="relative flex-1 min-w-[240px]">
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
                type="text"
                bind:value={searchTerm}
                placeholder="Cari tipe filter atau kode material..."
                class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 transition-colors"
            />
        </div>

        <div class="flex items-center gap-2 flex-wrap">
            <button
                onclick={() => filterStatus = 'ALL'}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all {filterStatus === 'ALL' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'}"
            >
                Semua ({$filterStockStore.length})
            </button>
            <button
                onclick={() => filterStatus = 'HABIS'}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all {filterStatus === 'HABIS' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'}"
            >
                🚨 Habis ({$stockAlertStore.habis})
            </button>
            <button
                onclick={() => filterStatus = 'MENIPIS'}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all {filterStatus === 'MENIPIS' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'}"
            >
                ⚠️ Menipis ({$stockAlertStore.menipis})
            </button>
            <button
                onclick={() => filterStatus = 'CUKUP'}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all {filterStatus === 'CUKUP' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'}"
            >
                ✅ Cukup
            </button>
        </div>
    </div>

    <!-- Stock Table -->
    <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] overflow-hidden shadow-2xl">
        {#if $filterStockStore.length === 0}
            <div class="p-12 text-center text-slate-500 text-sm">
                Belum ada data tipe filter terdaftar.
            </div>
        {:else if filteredStock.length === 0}
            <div class="p-12 text-center text-slate-500 text-sm">
                Tidak ada tipe filter yang sesuai dengan pencarian/filter.
            </div>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800/80" style="background: rgba(8,12,20,0.7);">
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Status</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Nama / Tipe Filter</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center whitespace-nowrap">Stok Saat Ini</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center whitespace-nowrap">Min. Stok</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Catatan / Kode Part</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right whitespace-nowrap">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredStock as item, i}
                            {@const isHabis = item.quantity === 0}
                            {@const isMenipis = item.quantity > 0 && item.quantity <= item.min_quantity}
                            <tr class="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                                <!-- Status Badge -->
                                <td class="py-3.5 px-4 whitespace-nowrap">
                                    {#if isHabis}
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-bold uppercase tracking-wide">
                                            🚨 Stok Habis
                                        </span>
                                    {:else if isMenipis}
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold uppercase tracking-wide">
                                            ⚠️ Menipis
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
                                            ✅ Aman
                                        </span>
                                    {/if}
                                </td>

                                <!-- Filter Name -->
                                <td class="py-3.5 px-4">
                                    <div class="text-[13px] font-bold text-white flex items-center gap-2">
                                        <span>{item.filter_name}</span>
                                    </div>
                                    <div class="text-[11px] text-slate-500">ID: #{item.id}</div>
                                </td>

                                <!-- Quantity + Adjust Button -->
                                <td class="py-3.5 px-4 text-center whitespace-nowrap">
                                    <div class="inline-flex items-center justify-center gap-2.5">
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs {isHabis ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300' : isMenipis ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'}">
                                            <span class="text-sm font-black">{item.quantity}</span>
                                            <span class="text-[10px] opacity-75">pcs</span>
                                        </span>

                                        <button
                                            onclick={() => openAdjustModal(item, 'add')}
                                            class="px-2.5 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600 border border-sky-500/30 text-sky-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm active:scale-95"
                                            title="Tambah stok (memerlukan konfirmasi PIN)"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                                            </svg>
                                            <span>Tambah Stok</span>
                                        </button>
                                    </div>
                                </td>

                                <!-- Min Quantity -->
                                <td class="py-3.5 px-4 text-center whitespace-nowrap text-xs text-slate-400">
                                    <span class="px-2 py-1 rounded-md bg-slate-900/50 border border-slate-800">
                                        &le; {item.min_quantity} pcs
                                    </span>
                                </td>

                                <!-- Notes -->
                                <td class="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate">
                                    {item.notes || '—'}
                                </td>

                                <!-- Actions -->
                                <td class="py-3.5 px-4 text-right whitespace-nowrap">
                                    <div class="flex items-center justify-end gap-1.5">
                                        <!-- Adjust Custom -->
                                        <button
                                            onclick={() => openAdjustModal(item, 'add')}
                                            class="px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 transition-all text-xs font-semibold flex items-center gap-1"
                                            title="Atur kuota stok masuk/keluar (perlu PIN)"
                                        >
                                            <span>🔢</span> Atur Stok
                                        </button>

                                        <!-- Edit -->
                                        <button
                                            onclick={() => openEditModal(item)}
                                            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-all text-xs"
                                            title="Edit Tipe Filter"
                                        >
                                            ✏️
                                        </button>

                                        <!-- Delete -->
                                        <button
                                            onclick={() => openDeleteModal(item)}
                                            class="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-xs"
                                            title="Hapus Tipe Filter"
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
        {/if}
    </div>

</div>

<!-- ================= MODAL TAMBAH TIPE FILTER ================= -->
{#if showAddModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div class="bg-[#0D1424] border border-slate-700/60 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-left">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <span>📦</span>
                    <span class="text-white text-base">Tambah Tipe Filter Baru</span>
                </div>
                <button onclick={() => showAddModal = false} class="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            {#if errorMessage}
                <div class="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {errorMessage}
                </div>
            {/if}

            <form onsubmit={handleAddSubmit} class="space-y-4 mt-4 text-xs">
                <div>
                    <label for="add-filter-name" class="block font-semibold text-slate-300 mb-1.5">Nama / Tipe Filter *</label>
                    <input
                        id="add-filter-name"
                        type="text"
                        bind:value={formName}
                        placeholder="Contoh: MDF 250-1, FEC 250, dll"
                        required
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60"
                    />
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="add-filter-qty" class="block font-semibold text-slate-300 mb-1.5">Stok Awal (pcs) *</label>
                        <input
                            id="add-filter-qty"
                            type="number"
                            min="0"
                            bind:value={formQuantity}
                            required
                            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white focus:outline-none focus:border-sky-500/60"
                        />
                    </div>
                    <div>
                        <label for="add-filter-min-qty" class="block font-semibold text-slate-300 mb-1.5">Batas Min. Notice *</label>
                        <input
                            id="add-filter-min-qty"
                            type="number"
                            min="1"
                            bind:value={formMinQuantity}
                            required
                            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white focus:outline-none focus:border-sky-500/60"
                        />
                    </div>
                </div>

                <div>
                    <label for="add-filter-notes" class="block font-semibold text-slate-300 mb-1.5">Catatan / Kode Material</label>
                    <textarea
                        id="add-filter-notes"
                        bind:value={formNotes}
                        rows="2"
                        placeholder="Kode part material atau info tambahan..."
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60"
                    ></textarea>
                </div>

                <div class="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                    <button
                        type="button"
                        onclick={() => showAddModal = false}
                        class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-white font-bold hover:from-sky-500 hover:to-cyan-400 shadow-lg shadow-sky-600/20 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Tipe Filter'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- ================= MODAL EDIT TIPE FILTER ================= -->
{#if showEditModal && activeItem}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div class="bg-[#0D1424] border border-slate-700/60 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-left">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <span>✏️</span>
                    <span class="text-white text-base">Edit Tipe Filter</span>
                </div>
                <button onclick={() => showEditModal = false} class="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            {#if errorMessage}
                <div class="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {errorMessage}
                </div>
            {/if}

            <form onsubmit={handleEditSubmit} class="space-y-4 mt-4 text-xs">
                <div>
                    <label for="edit-filter-name" class="block font-semibold text-slate-300 mb-1.5">Nama / Tipe Filter *</label>
                    <input
                        id="edit-filter-name"
                        type="text"
                        bind:value={formName}
                        required
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white focus:outline-none focus:border-sky-500/60"
                    />
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="edit-filter-qty" class="block font-semibold text-slate-300 mb-1.5">Stok Saat Ini (pcs) *</label>
                        <input
                            id="edit-filter-qty"
                            type="number"
                            min="0"
                            bind:value={formQuantity}
                            required
                            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white focus:outline-none focus:border-sky-500/60"
                        />
                    </div>
                    <div>
                        <label for="edit-filter-min-qty" class="block font-semibold text-slate-300 mb-1.5">Batas Min. Notice *</label>
                        <input
                            id="edit-filter-min-qty"
                            type="number"
                            min="1"
                            bind:value={formMinQuantity}
                            required
                            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white focus:outline-none focus:border-sky-500/60"
                        />
                    </div>
                </div>

                <div>
                    <label for="edit-filter-notes" class="block font-semibold text-slate-300 mb-1.5">Catatan / Kode Material</label>
                    <textarea
                        id="edit-filter-notes"
                        bind:value={formNotes}
                        rows="2"
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white focus:outline-none focus:border-sky-500/60"
                    ></textarea>
                </div>

                <div class="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                    <button
                        type="button"
                        onclick={() => showEditModal = false}
                        class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 shadow-lg shadow-sky-600/20 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Perbarui'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- ================= MODAL ADJUST STOK ================= -->
{#if showAdjustModal && activeItem}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div class="bg-[#0D1424] border border-slate-700/60 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-left">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <span>🔢</span>
                    <span class="text-white text-base">Atur Kuota Stok</span>
                </div>
                <button onclick={() => showAdjustModal = false} class="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            <div class="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div class="text-[11px] text-slate-500">Tipe Filter:</div>
                <div class="text-sm font-bold text-white mt-0.5">{activeItem.filter_name}</div>
                <div class="text-xs text-sky-400 mt-1">Stok saat ini: <b>{activeItem.quantity} pcs</b></div>
            </div>

            {#if errorMessage}
                <div class="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {errorMessage}
                </div>
            {/if}

            <form onsubmit={handleAdjustSubmit} class="space-y-4 mt-4 text-xs">
                <!-- Action toggle -->
                <div class="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                    <button
                        type="button"
                        onclick={() => adjustType = 'add'}
                        class="py-1.5 rounded-lg font-bold transition-all {adjustType === 'add' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}"
                    >
                        ➕ Tambah Stok Masuk
                    </button>
                    <button
                        type="button"
                        onclick={() => adjustType = 'sub'}
                        class="py-1.5 rounded-lg font-bold transition-all {adjustType === 'sub' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'}"
                    >
                        ➖ Kurangi Stok
                    </button>
                </div>

                <div>
                    <label for="adjust-amount-input" class="block font-semibold text-slate-300 mb-1.5">Jumlah (pcs) *</label>
                    <input
                        id="adjust-amount-input"
                        type="number"
                        min="1"
                        bind:value={adjustAmount}
                        required
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-sky-500/60"
                    />
                </div>

                <!-- Quick Presets -->
                <div class="flex items-center gap-1.5 justify-center flex-wrap">
                    {#each [1, 2, 5, 10, 20, 50] as preset}
                        <button
                            type="button"
                            onclick={() => adjustAmount = preset}
                            class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
                        >
                            +{preset}
                        </button>
                    {/each}
                </div>

                <div class="p-2.5 rounded-xl bg-sky-950/20 border border-sky-500/20 text-[11px] text-sky-300">
                    Stok baru nantinya: <b>{Math.max(0, activeItem.quantity + (adjustType === 'add' ? Number(adjustAmount) : -Number(adjustAmount)))} pcs</b>
                </div>

                <!-- Konfirmasi PIN Keamanan (Wajib) -->
                <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div class="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        <span>Konfirmasi PIN Keamanan (6 Digit) *</span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight">
                        Masukkan PIN keamanan untuk otorisasi agar stok tidak dapat diubah sembarangan.
                    </p>
                    <input
                        id="adjust-pin-input"
                        type="password"
                        maxlength="6"
                        pattern="[0-9]*"
                        inputmode="numeric"
                        bind:value={formPin}
                        placeholder="•••••• (6 Digit PIN)"
                        required
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-mono tracking-widest text-center text-lg placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                    />
                </div>

                <div class="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                    <button
                        type="button"
                        onclick={() => showAdjustModal = false}
                        class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !formPin || formPin.length !== 6}
                        class="px-5 py-2 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 {adjustType === 'add' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'}"
                    >
                        {isSubmitting ? 'Memverifikasi PIN...' : adjustType === 'add' ? 'Konfirmasi Tambah Stok' : 'Konfirmasi Kurangi Stok'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- ================= MODAL DELETE ================= -->
{#if showDeleteModal && activeItem}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div class="bg-[#0D1424] border border-rose-500/30 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-left">
            <div class="flex items-center gap-3 pb-3 border-b border-slate-800 text-rose-400">
                <div class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-xl shrink-0">
                    🗑️
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">Hapus Tipe Filter</h3>
                    <p class="text-[11px] text-slate-400">Konfirmasi penghapusan master</p>
                </div>
            </div>

            <p class="text-xs text-slate-300 my-4 leading-relaxed">
                Apakah Anda yakin ingin menghapus tipe filter <b class="text-white">"{activeItem.filter_name}"</b>?
            </p>

            {#if errorMessage}
                <div class="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {errorMessage}
                </div>
            {/if}

            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                    type="button"
                    onclick={() => showDeleteModal = false}
                    class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onclick={handleDeleteSubmit}
                    disabled={isSubmitting}
                    class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                    {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
            </div>
        </div>
    </div>
{/if}
