<script>
    import { statsStore } from '$lib/stores/filterStore';

    let groups = $derived(Object.entries($statsStore.groups));
</script>

<div class="space-y-8 animate-fadeIn">

    <!-- Page Header -->
    <div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-base">📊</span>
            Analisis Ringkasan Group Perusahaan
        </h2>
        <p class="text-[13px] text-slate-500 mt-1.5 ml-[42px]">
            Breakdown sebaran unit tangki & status maintenance per Group Konsumen.
        </p>
    </div>

    {#if groups.length === 0}
        <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-16 text-center">
            <div class="text-3xl opacity-30 mb-3">🏢</div>
            <div class="text-sm font-semibold text-slate-400">Belum ada data grup</div>
            <div class="text-xs text-slate-600 mt-1">Import seed.sql untuk memuat data.</div>
        </div>
    {:else}
        <!-- Summary row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-4 text-center">
                <div class="text-2xl font-black text-white">{$statsStore.total}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Total Unit</div>
            </div>
            <div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <div class="text-2xl font-black text-emerald-400">{$statsStore.aman}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Status Aman</div>
            </div>
            <div class="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                <div class="text-2xl font-black text-amber-400">{$statsStore.notice}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Notice</div>
            </div>
            <div class="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
                <div class="text-2xl font-black text-rose-400">{$statsStore.jatuh_tempo}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Jatuh Tempo</div>
            </div>
        </div>

        <!-- Per-group cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {#each groups as [grpName, grpData]}
                {@const pct = grpData.total > 0 ? Math.round((grpData.noticeCount / grpData.total) * 100) : 0}
                {@const amanCount = grpData.total - grpData.noticeCount - ($statsStore.non_aktif ?? 0)}
                <div class="rounded-2xl border border-slate-800/60 bg-[#0d1424] p-5 space-y-4 hover:border-slate-700/60 transition-all">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-base">🏢</div>
                            <div>
                                <div class="text-sm font-bold text-white">{grpName}</div>
                                <div class="text-[11px] text-slate-500">{grpData.total} unit</div>
                            </div>
                        </div>
                        {#if grpData.noticeCount > 0}
                            <span class="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
                                {grpData.noticeCount} perlu tindakan
                            </span>
                        {:else}
                            <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                                ✅ Semua aman
                            </span>
                        {/if}
                    </div>

                    <!-- Stats row -->
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="rounded-xl bg-slate-900/50 border border-slate-800/60 py-2.5">
                            <div class="text-lg font-bold text-white">{grpData.total}</div>
                            <div class="text-[10px] text-slate-600 mt-0.5">Total</div>
                        </div>
                        <div class="rounded-xl bg-amber-500/5 border border-amber-500/15 py-2.5">
                            <div class="text-lg font-bold text-amber-400">{grpData.noticeCount}</div>
                            <div class="text-[10px] text-slate-600 mt-0.5">Notice</div>
                        </div>
                        <div class="rounded-xl bg-emerald-500/5 border border-emerald-500/15 py-2.5">
                            <div class="text-lg font-bold text-emerald-400">{Math.max(0, grpData.total - grpData.noticeCount)}</div>
                            <div class="text-[10px] text-slate-600 mt-0.5">Aman</div>
                        </div>
                    </div>

                    <!-- Progress bar -->
                    <div>
                        <div class="flex justify-between text-[10px] text-slate-600 mb-1.5">
                            <span>Persentase perlu tindakan</span>
                            <span class="font-semibold {pct > 20 ? 'text-amber-400' : 'text-slate-500'}">{pct}%</span>
                        </div>
                        <div class="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                                class="h-full rounded-full transition-all duration-700 {pct > 30 ? 'bg-rose-500' : pct > 0 ? 'bg-amber-500' : 'bg-emerald-500'}"
                                style="width: {pct}%"
                            ></div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
