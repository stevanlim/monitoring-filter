<script>
    import { groupsStore, recordsStore } from '$lib/stores/filterStore';

    let searchTerm = $state('');

    // Modal states
    let isAddModalOpen = $state(false);
    let isEditModalOpen = $state(false);
    let isDeleteModalOpen = $state(false);

    // Selected group for Edit / Delete
    let activeGroup = $state(null);

    // Form inputs
    let formName = $state('');
    let formDescription = $state('');
    let formContactPerson = $state('');
    let formContactPhone = $state('');
    let isSubmitting = $state(false);
    let formError = $state('');

    // Delete options
    let deleteWithTanks = $state(false);

    // Filtered groups
    let filteredGroups = $derived($groupsStore.filter(g => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            (g.name && g.name.toLowerCase().includes(s)) ||
            (g.description && g.description.toLowerCase().includes(s)) ||
            (g.contact_person && g.contact_person.toLowerCase().includes(s)) ||
            (g.contact_phone && g.contact_phone.includes(s))
        );
    }));

    // Total stats
    let totalTanks = $derived($groupsStore.reduce((acc, g) => acc + (g.total_tanks || 0), 0));
    let totalNotices = $derived($groupsStore.reduce((acc, g) => acc + (g.notice_count || 0), 0));

    function openAddModal() {
        formName = '';
        formDescription = '';
        formContactPerson = '';
        formContactPhone = '';
        formError = '';
        isAddModalOpen = true;
    }

    function openEditModal(group) {
        activeGroup = group;
        formName = group.name;
        formDescription = group.description || '';
        formContactPerson = group.contact_person || '';
        formContactPhone = group.contact_phone || '';
        formError = '';
        isEditModalOpen = true;
    }

    function openDeleteModal(group) {
        activeGroup = group;
        deleteWithTanks = false;
        isDeleteModalOpen = true;
    }

    async function handleAddSubmit(e) {
        e.preventDefault();
        if (!formName.trim()) return;
        isSubmitting = true;
        formError = '';

        const res = await groupsStore.addGroup({
            name: formName.trim(),
            description: formDescription.trim(),
            contact_person: formContactPerson.trim(),
            contact_phone: formContactPhone.trim()
        });

        isSubmitting = false;
        if (res.success) {
            isAddModalOpen = false;
        } else {
            formError = res.error || 'Gagal menambahkan group';
        }
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        if (!activeGroup || !formName.trim()) return;
        isSubmitting = true;
        formError = '';

        const res = await groupsStore.editGroup(activeGroup.id, activeGroup.name, {
            name: formName.trim(),
            description: formDescription.trim(),
            contact_person: formContactPerson.trim(),
            contact_phone: formContactPhone.trim()
        });

        isSubmitting = false;
        if (res.success) {
            isEditModalOpen = false;
            activeGroup = null;
        } else {
            formError = res.error || 'Gagal mengubah group';
        }
    }

    async function handleDeleteSubmit() {
        if (!activeGroup) return;
        isSubmitting = true;

        await groupsStore.deleteGroup(activeGroup.id, activeGroup.name, deleteWithTanks);

        isSubmitting = false;
        isDeleteModalOpen = false;
        activeGroup = null;
    }
</script>

<div class="space-y-8 animate-fadeIn">

    <!-- Page Header & Actions -->
    <div class="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-base">🏢</span>
                Kelola Group Perusahaan Konsumen
            </h2>
            <p class="text-[13px] text-slate-500 mt-1.5 ml-[42px]">
                Daftar master Group / Holding Perusahaan, penambahan grup baru, dan monitoring unit tangki per group.
            </p>
        </div>

        <button
            onclick={openAddModal}
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition-all active:scale-95"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Group Baru
        </button>
    </div>

    <!-- Summary KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-4 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl">
                🏢
            </div>
            <div>
                <div class="text-2xl font-black text-white">{$groupsStore.length}</div>
                <div class="text-xs text-slate-500">Group Perusahaan Terdaftar</div>
            </div>
        </div>

        <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-4 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl">
                🛢️
            </div>
            <div>
                <div class="text-2xl font-black text-sky-400">{totalTanks}</div>
                <div class="text-xs text-slate-500">Total Unit Terintegrasi</div>
            </div>
        </div>

        <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-4 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">
                ⚠️
            </div>
            <div>
                <div class="text-2xl font-black text-amber-400">{totalNotices}</div>
                <div class="text-xs text-slate-500">Unit Notice / Perlu Servis</div>
            </div>
        </div>
    </div>

    <!-- Search Bar -->
    <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-3.5">
        <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
                type="text"
                bind:value={searchTerm}
                placeholder="Cari nama group, PIC, deskripsi, atau kontak..."
                class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 transition-colors"
            />
        </div>
    </div>

    <!-- Group Cards Grid -->
    {#if filteredGroups.length === 0}
        <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-16 text-center">
            <div class="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-3xl mx-auto mb-4 opacity-50">🏢</div>
            <div class="text-base font-semibold text-slate-300 mb-1">Tidak ada group ditemukan</div>
            <div class="text-sm text-slate-500">Klik tombol "Tambah Group Baru" untuk menambahkan group perusahaan.</div>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {#each filteredGroups as group}
                <div class="rounded-2xl border border-slate-800/70 bg-[#0d1424] hover:border-slate-700/80 transition-all p-5 space-y-4 relative group">
                    
                    <!-- Header -->
                    <div class="flex justify-between items-start gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/10 border border-indigo-500/30 flex items-center justify-center text-lg">
                                🏢
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-white group-hover:text-sky-400 transition-colors leading-snug">
                                    {group.name}
                                </h3>
                                {#if group.description}
                                    <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{group.description}</p>
                                {:else}
                                    <p class="text-[11px] text-slate-600 mt-0.5">Holding / Group Perusahaan</p>
                                {/if}
                            </div>
                        </div>

                        <!-- Notice Badge -->
                        {#if group.notice_count > 0}
                            <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold shrink-0">
                                ⚠️ {group.notice_count} Notice
                            </span>
                        {:else}
                            <span class="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold shrink-0">
                                ✅ Aman
                            </span>
                        {/if}
                    </div>

                    <!-- Statistics Matrix -->
                    <div class="grid grid-cols-3 gap-2 text-center bg-slate-900/40 rounded-xl p-3 border border-slate-800/60">
                        <div>
                            <div class="text-base font-bold text-white">{group.total_tanks || 0}</div>
                            <div class="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Unit</div>
                        </div>
                        <div>
                            <div class="text-base font-bold text-sky-400">{group.total_estates || 0}</div>
                            <div class="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Estate/PT</div>
                        </div>
                        <div>
                            <div class="text-base font-bold text-slate-300">{group.total_regions || 0}</div>
                            <div class="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Wilayah</div>
                        </div>
                    </div>

                    <!-- PIC Info if any -->
                    {#if group.contact_person || group.contact_phone}
                        <div class="text-xs bg-slate-900/30 rounded-xl px-3 py-2 border border-slate-800/40 flex items-center justify-between">
                            <span class="text-slate-400 font-medium">👤 {group.contact_person || 'PIC Group'}</span>
                            {#if group.contact_phone}
                                <span class="text-emerald-400 font-mono text-[11px]">📱 {group.contact_phone}</span>
                            {/if}
                        </div>
                    {/if}

                    <!-- Action Links & Buttons -->
                    <div class="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1.5">
                            <a
                                href={`/records?group=${encodeURIComponent(group.name)}`}
                                class="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-all"
                            >
                                📋 Lihat Tangki
                            </a>
                            <a
                                href={`/gallery`}
                                class="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-all"
                            >
                                📁 Foto
                            </a>
                        </div>

                        <div class="flex items-center gap-1">
                            <!-- Edit Button -->
                            <button
                                onclick={() => openEditModal(group)}
                                class="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-all text-xs"
                                title="Edit info group"
                            >
                                ✏️
                            </button>

                            <!-- Delete Button -->
                            <button
                                onclick={() => openDeleteModal(group)}
                                class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-xs"
                                title="Hapus group"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>

                </div>
            {/each}
        </div>
    {/if}

</div>

<!-- Modal Tambah Group -->
{#if isAddModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div class="bg-[#0d1424] border border-slate-700/60 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            
            <div class="flex justify-between items-center pb-4 border-b border-slate-800">
                <div class="flex items-center gap-2">
                    <span class="text-xl">🏢</span>
                    <h3 class="text-base font-bold text-white">Tambah Group Perusahaan</h3>
                </div>
                <button onclick={() => isAddModalOpen = false} class="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onsubmit={handleAddSubmit} class="space-y-4 mt-4">
                
                <div>
                    <label for="new-group-name" class="block text-xs font-semibold text-slate-400 mb-1.5">Nama Group / Holding *</label>
                    <input
                        type="text"
                        id="new-group-name"
                        bind:value={formName}
                        required
                        placeholder="Contoh: Astra Agro Lestari, Sinarmas, dll"
                        class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                </div>

                <div>
                    <label for="new-group-desc" class="block text-xs font-semibold text-slate-400 mb-1.5">Deskripsi / Keterangan (Opsional)</label>
                    <input
                        type="text"
                        id="new-group-desc"
                        bind:value={formDescription}
                        placeholder="Contoh: Kelapa Sawit & Perkebunan Nasional"
                        class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="new-pic-name" class="block text-xs font-semibold text-slate-400 mb-1.5">Nama PIC Group</label>
                        <input
                            type="text"
                            id="new-pic-name"
                            bind:value={formContactPerson}
                            placeholder="Contoh: Bp. Hendra"
                            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>
                    <div>
                        <label for="new-pic-phone" class="block text-xs font-semibold text-slate-400 mb-1.5">No WhatsApp</label>
                        <input
                            type="text"
                            id="new-pic-phone"
                            bind:value={formContactPhone}
                            placeholder="628123456789"
                            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>
                </div>

                {#if formError}
                    <div class="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-300">
                        ⚠️ {formError}
                    </div>
                {/if}

                <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                        type="button"
                        onclick={() => isAddModalOpen = false}
                        class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-60 flex items-center gap-2"
                    >
                        {#if isSubmitting}
                            <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Menyimpan...
                        {:else}
                            Simpan Group
                        {/if}
                    </button>
                </div>

            </form>

        </div>
    </div>
{/if}

<!-- Modal Edit Group -->
{#if isEditModalOpen && activeGroup}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div class="bg-[#0d1424] border border-slate-700/60 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            
            <div class="flex justify-between items-center pb-4 border-b border-slate-800">
                <div class="flex items-center gap-2">
                    <span class="text-xl">✏️</span>
                    <h3 class="text-base font-bold text-white">Edit Group Perusahaan</h3>
                </div>
                <button onclick={() => isEditModalOpen = false} class="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onsubmit={handleEditSubmit} class="space-y-4 mt-4">
                
                <div>
                    <label for="edit-group-name" class="block text-xs font-semibold text-slate-400 mb-1.5">Nama Group *</label>
                    <input
                        type="text"
                        id="edit-group-name"
                        bind:value={formName}
                        required
                        class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                    <p class="text-[10px] text-slate-500 mt-1">Mengubah nama group akan otomatis memperbarui seluruh data tangki di group ini.</p>
                </div>

                <div>
                    <label for="edit-group-desc" class="block text-xs font-semibold text-slate-400 mb-1.5">Deskripsi / Keterangan</label>
                    <input
                        type="text"
                        id="edit-group-desc"
                        bind:value={formDescription}
                        class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="edit-pic-name" class="block text-xs font-semibold text-slate-400 mb-1.5">Nama PIC</label>
                        <input
                            type="text"
                            id="edit-pic-name"
                            bind:value={formContactPerson}
                            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>
                    <div>
                        <label for="edit-pic-phone" class="block text-xs font-semibold text-slate-400 mb-1.5">No WhatsApp</label>
                        <input
                            type="text"
                            id="edit-pic-phone"
                            bind:value={formContactPhone}
                            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>
                </div>

                {#if formError}
                    <div class="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-300">
                        ⚠️ {formError}
                    </div>
                {/if}

                <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                        type="button"
                        onclick={() => isEditModalOpen = false}
                        class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-60 flex items-center gap-2"
                    >
                        {#if isSubmitting}
                            <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Menyimpan...
                        {:else}
                            Perbarui Group
                        {/if}
                    </button>
                </div>

            </form>

        </div>
    </div>
{/if}

<!-- Modal Konfirmasi Hapus Group -->
{#if isDeleteModalOpen && activeGroup}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
        <div class="bg-[#0d1424] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            
            <div class="flex items-center gap-3 pb-4 border-b border-slate-800 text-rose-400">
                <div class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-xl shrink-0">
                    🗑️
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">Hapus Group Perusahaan</h3>
                    <p class="text-[11px] text-slate-400">Konfirmasi tindakan penghapusan</p>
                </div>
            </div>

            <div class="space-y-4 my-5 text-xs text-slate-300">
                <p>
                    Apakah Anda yakin ingin menghapus group <span class="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{activeGroup.name}</span>?
                </p>

                {#if activeGroup.total_tanks > 0}
                    <div class="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2 text-amber-200">
                        <div class="font-bold flex items-center gap-1.5">
                            <span>⚠️</span> Perhatian: Ada {activeGroup.total_tanks} unit tangki di group ini!
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer pt-1 text-slate-300">
                            <input
                                type="checkbox"
                                bind:checked={deleteWithTanks}
                                class="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500"
                            />
                            <span>Hapus juga seluruh {activeGroup.total_tanks} data unit tangki & riwayat maintenance</span>
                        </label>
                        {#if !deleteWithTanks}
                            <p class="text-[11px] text-slate-400 italic">
                                *Jika opsi di atas tidak dicentang, data tangki akan tetap tersimpan di database.
                            </p>
                        {/if}
                    </div>
                {/if}
            </div>

            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                    type="button"
                    onclick={() => isDeleteModalOpen = false}
                    class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onclick={handleDeleteSubmit}
                    disabled={isSubmitting}
                    class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {#if isSubmitting}
                        <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Menghapus...
                    {:else}
                        Ya, Hapus Group
                    {/if}
                </button>
            </div>

        </div>
    </div>
{/if}
