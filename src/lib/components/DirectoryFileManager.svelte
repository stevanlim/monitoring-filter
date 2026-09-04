<script>
    import { photoDirectoryStore } from '$lib/stores/filterStore';

    let selectedGroup  = $state('ALL');
    let selectedRegion = $state('ALL');
    let selectedEstate = $state('ALL');
    let activePhoto    = $state(null);

    let tree   = $derived($photoDirectoryStore.tree);
    let groups = $derived(Object.keys(tree));

    let availableRegions = $derived(
        selectedGroup !== 'ALL' && tree[selectedGroup]
            ? Object.keys(tree[selectedGroup])
            : []
    );

    let availableEstates = $derived(
        selectedGroup !== 'ALL' && selectedRegion !== 'ALL' && tree[selectedGroup]?.[selectedRegion]
            ? Object.keys(tree[selectedGroup][selectedRegion])
            : []
    );

    let photosList = $derived(collectPhotos(tree, selectedGroup, selectedRegion, selectedEstate));

    function collectPhotos(treeObj, grp, reg, est) {
        const list = [];
        for (const g of Object.keys(treeObj)) {
            if (grp !== 'ALL' && g !== grp) continue;
            for (const r of Object.keys(treeObj[g])) {
                if (reg !== 'ALL' && r !== reg) continue;
                for (const e of Object.keys(treeObj[g][r])) {
                    if (est !== 'ALL' && e !== est) continue;
                    for (const p of treeObj[g][r][e]) {
                        list.push(p);
                    }
                }
            }
        }
        return list;
    }

    function nav(g = 'ALL', r = 'ALL', e = 'ALL') {
        selectedGroup  = g;
        selectedRegion = r;
        selectedEstate = e;
    }
</script>

<div class="space-y-6 animate-fadeIn">

    <!-- Page Header -->
    <div class="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-base">📁</span>
                Directory Foto Maintenance Filter
            </h2>
            <p class="text-[13px] text-slate-500 mt-1.5 ml-[42px]">
                Foto dokumentasi pergantian filter dikelompokkan per Group → Wilayah → Kebun.
            </p>
        </div>
        <span class="text-xs text-slate-500 tabular-nums">
            {$photoDirectoryStore.totalPhotos} foto tersimpan
        </span>
    </div>

    <!-- Breadcrumb bar -->
    <div class="flex items-center gap-1.5 text-sm overflow-x-auto pb-1">
        <button
            onclick={() => nav()}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap {selectedGroup === 'ALL' ? 'bg-sky-500/15 border border-sky-500/25 text-sky-400 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            Root
        </button>

        {#if selectedGroup !== 'ALL'}
            <span class="text-slate-700">/</span>
            <button
                onclick={() => nav(selectedGroup)}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap {selectedRegion === 'ALL' ? 'bg-sky-500/15 border border-sky-500/25 text-sky-400 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}"
            >
                🏢 {selectedGroup}
            </button>
        {/if}

        {#if selectedRegion !== 'ALL'}
            <span class="text-slate-700">/</span>
            <button
                onclick={() => nav(selectedGroup, selectedRegion)}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap {selectedEstate === 'ALL' ? 'bg-sky-500/15 border border-sky-500/25 text-sky-400 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}"
            >
                🗺️ {selectedRegion}
            </button>
        {/if}

        {#if selectedEstate !== 'ALL'}
            <span class="text-slate-700">/</span>
            <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/25 text-sky-400 font-semibold whitespace-nowrap">
                📍 {selectedEstate}
            </span>
        {/if}
    </div>

    <!-- Main content -->
    <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] overflow-hidden">
        <div class="flex flex-col lg:flex-row min-h-[520px]">

            <!-- Sidebar folder tree -->
            <div class="lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/60 p-4 space-y-1" style="background: rgba(8,12,20,0.5);">
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-2 mb-3">Group Perusahaan</p>

                <button
                    onclick={() => nav()}
                    class="w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-between gap-2 transition-all {selectedGroup === 'ALL' ? 'bg-sky-500/12 border border-sky-500/25 text-sky-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}"
                >
                    <span class="flex items-center gap-2 truncate">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                        </svg>
                        Semua Group
                    </span>
                    <span class="text-[10px] tabular-nums shrink-0 px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{$photoDirectoryStore.totalPhotos}</span>
                </button>

                {#each groups as grp}
                    <button
                        onclick={() => nav(grp)}
                        class="w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-medium flex items-center gap-2 transition-all truncate {selectedGroup === grp ? 'bg-sky-500/12 border border-sky-500/25 text-sky-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                        </svg>
                        <span class="truncate">{grp}</span>
                    </button>
                {/each}
            </div>

            <!-- Main explorer area -->
            <div class="flex-1 p-6 space-y-6">

                <!-- Sub-folders -->
                {#if selectedGroup === 'ALL'}
                    {#if groups.length === 0}
                        <div class="flex flex-col items-center justify-center h-64 text-center">
                            <div class="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-2xl mb-4 opacity-50">📷</div>
                            <div class="text-sm font-semibold text-slate-400 mb-1">Belum ada foto</div>
                            <div class="text-xs text-slate-600">Upload foto saat mencatat servis pergantian filter.</div>
                        </div>
                    {:else}
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                            {#each groups as grp}
                                <button
                                    onclick={() => nav(grp)}
                                    class="group p-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/40 hover:border-sky-500/30 transition-all text-left"
                                >
                                    <div class="text-3xl mb-2.5">📁</div>
                                    <div class="text-[12px] font-semibold text-slate-300 group-hover:text-sky-400 transition-colors leading-snug">{grp}</div>
                                    <div class="text-[10px] text-slate-600 mt-0.5">Group PT</div>
                                </button>
                            {/each}
                        </div>
                    {/if}

                {:else if selectedRegion === 'ALL'}
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {#each availableRegions as reg}
                            <button
                                onclick={() => nav(selectedGroup, reg)}
                                class="group p-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/40 hover:border-sky-500/30 transition-all text-left"
                            >
                                <div class="text-3xl mb-2.5">📂</div>
                                <div class="text-[12px] font-semibold text-slate-300 group-hover:text-sky-400 transition-colors leading-snug">{reg}</div>
                                <div class="text-[10px] text-slate-600 mt-0.5">Wilayah</div>
                            </button>
                        {/each}
                    </div>

                {:else if selectedEstate === 'ALL'}
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {#each availableEstates as est}
                            <button
                                onclick={() => nav(selectedGroup, selectedRegion, est)}
                                class="group p-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/40 hover:border-sky-500/30 transition-all text-left"
                            >
                                <div class="text-3xl mb-2.5">📍</div>
                                <div class="text-[12px] font-semibold text-slate-300 group-hover:text-sky-400 transition-colors leading-snug">{est}</div>
                                <div class="text-[10px] text-slate-600 mt-0.5">Kebun / Estate</div>
                            </button>
                        {/each}
                    </div>
                {/if}

                <!-- Photos grid (shown when a group or deeper is selected) -->
                {#if selectedGroup !== 'ALL'}
                    <div>
                        <div class="flex items-center gap-2 mb-4">
                            <div class="text-[11px] font-bold uppercase tracking-widest text-slate-600">Foto Maintenance</div>
                            <div class="h-[1px] flex-1 bg-slate-800/60"></div>
                            <div class="text-[11px] text-slate-600">{photosList.length} foto</div>
                        </div>

                        {#if photosList.length === 0}
                            <div class="rounded-2xl border-2 border-dashed border-slate-800/60 p-10 text-center">
                                <div class="text-3xl opacity-30 mb-2">📷</div>
                                <div class="text-sm text-slate-500">Belum ada foto di folder ini</div>
                                <div class="text-xs text-slate-600 mt-1">Upload foto saat mencatat servis filter.</div>
                            </div>
                        {:else}
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {#each photosList as photo}
                                    <button
                                        onclick={() => activePhoto = photo}
                                        class="group rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:border-sky-500/30 overflow-hidden transition-all text-left"
                                    >
                                        <div class="relative h-40 bg-slate-800/60 overflow-hidden">
                                            <img
                                                src={photo.url}
                                                alt={photo.caption}
                                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                <span class="text-white text-xs font-semibold">Lihat foto</span>
                                            </div>
                                            <div class="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[10px] text-slate-300 border border-slate-700/50">
                                                {photo.date ?? '—'}
                                            </div>
                                        </div>
                                        <div class="p-3">
                                            <div class="text-[12px] font-semibold text-slate-300 group-hover:text-sky-400 transition-colors truncate">{photo.estate}</div>
                                            <div class="text-[10px] text-slate-600 mt-0.5 truncate">{photo.group} / {photo.region}</div>
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

            </div>
        </div>
    </div>

</div>

<!-- Full photo preview modal -->
{#if activePhoto}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <!-- Backdrop -->
        <div 
            class="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" 
            onclick={() => activePhoto = null}
            role="presentation"
        ></div>

        <!-- Modal Dialog -->
        <div
            role="dialog"
            aria-modal="true"
            class="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-[#0d1424] overflow-hidden shadow-2xl text-left"
        >
            <!-- Close -->
            <button
                onclick={() => activePhoto = null}
                class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-all"
            >✕</button>

            <!-- Path badge -->
            <div class="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
                <span class="text-[11px] font-mono text-slate-400 truncate">{activePhoto.group} / {activePhoto.region} / {activePhoto.estate}</span>
            </div>

            <!-- Image -->
            <div class="bg-slate-950 flex items-center justify-center min-h-[280px] max-h-[60vh] overflow-hidden p-4">
                <img
                    src={activePhoto.url}
                    alt={activePhoto.caption}
                    class="max-h-[55vh] max-w-full rounded-xl object-contain border border-slate-800/60"
                />
            </div>

            <!-- Meta -->
            <div class="p-4 space-y-2 border-t border-slate-800">
                <div class="text-sm font-semibold text-white">{activePhoto.caption || activePhoto.estate}</div>
                <div class="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                        <div class="text-slate-600 mb-0.5">Tanggal Servis</div>
                        <div class="text-emerald-400 font-semibold">{activePhoto.date ?? '—'}</div>
                    </div>
                    <div>
                        <div class="text-slate-600 mb-0.5">Equipment</div>
                        <div class="text-sky-400 font-semibold">{activePhoto.equipment ?? '—'}</div>
                    </div>
                    <div>
                        <div class="text-slate-600 mb-0.5">Kapasitas</div>
                        <div class="text-slate-300">{activePhoto.tank_capacity ?? '—'}</div>
                    </div>
                    <div>
                        <div class="text-slate-600 mb-0.5">Di-upload oleh</div>
                        <div class="text-slate-300">{activePhoto.uploader ?? 'Teknisi Field'}</div>
                    </div>
                </div>

                <!-- Delete action -->
                <div class="pt-3 border-t border-slate-800/80 flex justify-between items-center">
                    <span class="text-[10px] text-slate-500 font-mono">{activePhoto.filename}</span>
                    <button
                        onclick={async () => {
                            if (confirm('Yakin ingin menghapus foto dokumentasi ini?')) {
                                const id = activePhoto.id;
                                const fp = activePhoto.filepath;
                                activePhoto = null;
                                await photoDirectoryStore.deletePhoto(id, fp);
                            }
                        }}
                        class="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus Foto
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
