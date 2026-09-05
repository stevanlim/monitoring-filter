<script>
    import { statsStore } from '$lib/stores/filterStore';

    const kpis = $derived([
        {
            label:    'Total Unit',
            sublabel: 'Terdaftar dari seluruh Group & Kebun',
            value:    $statsStore.total,
            icon:     '🛢️',
            color:    'sky',
            gradient: 'from-sky-500 to-cyan-400',
            bg:       'bg-sky-500/8',
            text:     'text-sky-400',
            border:   'border-sky-500/20',
        },
        {
            label:    'Filter Status Aman',
            sublabel: 'Masa pakai aktif > 30 hari',
            value:    $statsStore.aman,
            icon:     '✅',
            color:    'emerald',
            gradient: 'from-emerald-500 to-teal-400',
            bg:       'bg-emerald-500/8',
            text:     'text-emerald-400',
            border:   'border-emerald-500/20',
        },
        {
            label:    'Notice — Hubungi Konsumen',
            sublabel: 'Jatuh tempo 1–10 hari lagi',
            value:    $statsStore.notice,
            icon:     '⚠️',
            color:    'amber',
            gradient: 'from-amber-500 to-yellow-400',
            bg:       'bg-amber-500/8',
            text:     'text-amber-400',
            border:   'border-amber-500/20',
        },
        {
            label:    'Jatuh Tempo — Ganti Segera',
            sublabel: 'Wajib pergantian filter',
            value:    $statsStore.jatuh_tempo,
            icon:     '🚨',
            color:    'rose',
            gradient: 'from-rose-500 to-red-400',
            bg:       'bg-rose-500/8',
            text:     'text-rose-400',
            border:   'border-rose-500/20',
        },
    ]);
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {#each kpis as kpi}
        <div class="relative rounded-2xl overflow-hidden border {kpi.border} bg-[#0d1424] hover:bg-[#0f1929] transition-all duration-300 group cursor-default">
            <!-- Top accent bar -->
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r {kpi.gradient}"></div>

            <!-- Subtle glow blob -->
            <div class="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br {kpi.gradient} opacity-5 group-hover:opacity-10 transition-opacity blur-2xl"></div>

            <div class="p-4 sm:p-5 relative">
                <div class="flex items-start justify-between mb-3 sm:mb-4">
                    <div class="pr-2">
                        <p class="text-[11px] font-semibold uppercase tracking-wider sm:tracking-widest text-slate-400 sm:text-slate-500 leading-tight mb-1">{kpi.label}</p>
                        <p class="text-[10px] text-slate-500 sm:text-slate-600">{kpi.sublabel}</p>
                    </div>
                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl {kpi.bg} border {kpi.border} flex items-center justify-center text-base sm:text-lg shrink-0">
                        {kpi.icon}
                    </div>
                </div>

                <div class="flex items-end gap-2">
                    <span class="text-3xl sm:text-4xl font-black {kpi.value > 0 && kpi.color !== 'sky' && kpi.color !== 'emerald' ? kpi.text : 'text-white'} tracking-tight leading-none">
                        {kpi.value}
                    </span>
                    <span class="text-xs text-slate-500 mb-1">unit</span>
                </div>

                <!-- Progress bar -->
                {#if $statsStore.total > 0}
                    <div class="mt-3 h-1 rounded-full bg-slate-800/80 overflow-hidden">
                        <div
                            class="h-full rounded-full bg-gradient-to-r {kpi.gradient} transition-all duration-700"
                            style="width: {Math.round((kpi.value / $statsStore.total) * 100)}%"
                        ></div>
                    </div>
                    <div class="text-[10px] text-slate-600 mt-1.5">
                        {$statsStore.total > 0 ? Math.round((kpi.value / $statsStore.total) * 100) : 0}% dari total
                    </div>
                {/if}
            </div>
        </div>
    {/each}
</div>
