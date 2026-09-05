<script>
    import { filterStockStore } from '$lib/stores/filterStore';
    import { notificationStore } from '$lib/stores/notificationStore';

    let searchTerm = $state('');

    // Modals
    let showAddModal = $state(false);
    let showEditModal = $state(false);
    let showDeleteModal = $state(false);

    /** @type {any} */
    let activeItem = $state(null);

    // Form data
    let formName = $state('');
    let formNotes = $state('');

    let isSubmitting = $state(false);
    let errorMessage = $state('');

    let filteredList = $derived($filterStockStore.filter(item => {
        if (!searchTerm.trim()) return true;
        const s = searchTerm.toLowerCase();
        return (item.filter_name && item.filter_name.toLowerCase().includes(s)) ||
               (item.notes && item.notes.toLowerCase().includes(s));
    }));

    function openAddModal() {
        formName = '';
        formNotes = '';
        errorMessage = '';
        showAddModal = true;
    }

    /** @param {any} item */
    function openEditModal(item) {
        activeItem = item;
        formName = item.filter_name;
        formNotes = item.notes || '';
        errorMessage = '';
        showEditModal = true;
    }

    /** @param {any} item */
    function openDeleteModal(item) {
        activeItem = item;
        errorMessage = '';
        showDeleteModal = true;
    }

    /** @param {SubmitEvent} e */
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
            notes: formNotes.trim()
        });
        isSubmitting = false;

        if (res.success) {
            notificationStore.success('Tipe Filter Ditambahkan', `Tipe filter "${formName.trim()}" berhasil didaftarkan ke sistem.`);
            showAddModal = false;
        } else {
            errorMessage = res.error;
        }
    }

    /** @param {SubmitEvent} e */
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

    async function handleDeleteSubmit() {
        if (isSubmitting || !activeItem) return;

        isSubmitting = true;
        errorMessage = '';
        const res = await filterStockStore.deleteItem(activeItem.id);
        isSubmitting = false;

        if (res.success) {
            notificationStore.success('Tipe Filter Dihapus', `Tipe filter "${activeItem.filter_name}" berhasil dihapus dari opsi sistem.`);
            showDeleteModal = false;
            activeItem = null;
        } else {
            errorMessage = res.error;
        }
    }
</script>

<svelte:head>
    <title>Kelola Tipe Filter — PT. Anugerah Rezeki Teknindo</title>
</svelte:head>

<div class="space-y-6 animate-fadeIn pb-12">

    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
            <h2 class="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-2.5">
                <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sm sm:text-base shrink-0">🏷️</span>
                Kelola Tipe Filter
            </h2>
            <p class="text-[12px] sm:text-[13px] text-slate-400 mt-1 sm:mt-1.5 sm:ml-[42px]">
                Katalog tipe filter untuk manajemen daftar unit filter.
            </p>
        </div>

        <button
            onclick={openAddModal}
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition-all active:scale-95 cursor-pointer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Tambah Tipe Filter
        </button>
    </div>

    <!-- KPI Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Total Tipe -->
        <div class="rounded-2xl border border-slate-800/80 bg-[#0D1424]/90 p-4 relative overflow-hidden">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tipe Filter Terdaftar</div>
            <div class="text-2xl font-black text-white mt-1">{$filterStockStore.length} <span class="text-xs text-slate-500 font-normal">tipe</span></div>
            <div class="text-[11px] text-slate-500 mt-1">Katalog model & tipe filter Microcleaner aktif</div>
            <div class="absolute -right-2 -bottom-2 text-4xl opacity-10">📋</div>
        </div>

        <!-- Status Integrasi Form -->
        <div class="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 relative overflow-hidden">
            <div class="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Integrasi Opsi Pilihan</div>
            <div class="text-base font-bold text-sky-300 mt-1.5 flex items-center gap-2">
                <span>✅ Tersedia Langsung di Form</span>
            </div>
            <div class="text-[11px] text-sky-400/60 mt-1">Daftar tipe di bawah otomatis muncul sebagai pilihan opsi tanpa perlu tulis tangan</div>
            <div class="absolute -right-2 -bottom-2 text-4xl opacity-10">⚙️</div>
        </div>
    </div>

    <!-- Search Bar -->
    <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-4 flex flex-wrap gap-3 items-center justify-between">
        <div class="relative flex-1 min-w-[240px]">
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
                type="text"
                bind:value={searchTerm}
                placeholder="Cari nama tipe filter atau catatan spesifikasi..."
                class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 transition-colors"
            />
        </div>
        <div class="text-xs text-slate-400 font-medium">
            Menampilkan <span class="font-bold text-sky-400">{filteredList.length}</span> tipe filter
        </div>
    </div>

    <!-- Filter Table -->
    <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] overflow-hidden shadow-2xl">
        {#if $filterStockStore.length === 0}
            <div class="p-12 text-center text-slate-500 text-sm">
                Belum ada data tipe filter terdaftar. Klik tombol <b>"Tambah Tipe Filter"</b> untuk menambahkan model baru.
            </div>
        {:else if filteredList.length === 0}
            <div class="p-12 text-center text-slate-500 text-sm">
                Tidak ada tipe filter yang sesuai dengan pencarian.
            </div>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800/80" style="background: rgba(8,12,20,0.7);">
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-12 text-center">No</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Nama / Tipe Filter</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Catatan / Spesifikasi</th>
                            <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right whitespace-nowrap w-28">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredList as item, i}
                            <tr class="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                                <!-- No -->
                                <td class="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                                    {i + 1}
                                </td>

                                <!-- Filter Name -->
                                <td class="py-3.5 px-4">
                                    <div class="text-[13px] font-bold text-white flex items-center gap-2">
                                        <span class="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs">
                                            {item.filter_name}
                                        </span>
                                    </div>
                                </td>

                                <!-- Notes -->
                                <td class="py-3.5 px-4 text-xs text-slate-300">
                                    {item.notes || '—'}
                                </td>

                                <!-- Actions -->
                                <td class="py-3.5 px-4 text-right whitespace-nowrap">
                                    <div class="flex items-center justify-end gap-1.5">
                                        <!-- Edit -->
                                        <button
                                            onclick={() => openEditModal(item)}
                                            class="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                            title="Edit Tipe Filter"
                                        >
                                            <span>✏️</span> Edit
                                        </button>

                                        <!-- Delete -->
                                        <button
                                            onclick={() => openDeleteModal(item)}
                                            class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                            title="Hapus Tipe Filter"
                                        >
                                            <span>🗑️</span> Hapus
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
                    <span>🏷️</span>
                    <span class="text-white text-base">Tambah Tipe Filter Baru</span>
                </div>
                <button onclick={() => showAddModal = false} class="text-slate-500 hover:text-white text-lg cursor-pointer">✕</button>
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
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500/60"
                    />
                </div>

                <div>
                    <label for="add-notes" class="block font-semibold text-slate-300 mb-1.5">Catatan / Spesifikasi (Opsional)</label>
                    <textarea
                        id="add-notes"
                        bind:value={formNotes}
                        rows="3"
                        placeholder="Keterangan spesifikasi teknis, fungsi, atau kode part..."
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500/60 resize-none"
                    ></textarea>
                </div>

                <div class="pt-2 flex justify-end gap-2">
                    <button
                        type="button"
                        onclick={() => showAddModal = false}
                        class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
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
                <button onclick={() => showEditModal = false} class="text-slate-500 hover:text-white text-lg cursor-pointer">✕</button>
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
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500/60"
                    />
                </div>

                <div>
                    <label for="edit-notes" class="block font-semibold text-slate-300 mb-1.5">Catatan / Spesifikasi (Opsional)</label>
                    <textarea
                        id="edit-notes"
                        bind:value={formNotes}
                        rows="3"
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500/60 resize-none"
                    ></textarea>
                </div>

                <div class="pt-2 flex justify-end gap-2">
                    <button
                        type="button"
                        onclick={() => showEditModal = false}
                        class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- ================= MODAL HAPUS TIPE FILTER ================= -->
{#if showDeleteModal && activeItem}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div class="bg-[#0D1424] border border-slate-700/60 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-left">
            <div class="text-rose-400 text-2xl mb-2">⚠️</div>
            <h3 class="text-base font-bold text-white">Hapus Tipe Filter?</h3>
            <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus tipe filter <span class="text-white font-bold font-mono">"{activeItem.filter_name}"</span> dari daftar opsi sistem?
            </p>

            {#if errorMessage}
                <div class="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {errorMessage}
                </div>
            {/if}

            <div class="pt-5 flex justify-end gap-2">
                <button
                    type="button"
                    onclick={() => showDeleteModal = false}
                    class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onclick={handleDeleteSubmit}
                    disabled={isSubmitting}
                    class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                    {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
            </div>
        </div>
    </div>
{/if}
