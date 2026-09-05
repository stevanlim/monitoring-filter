<script>
    import { page } from "$app/state";
    import { statsStore } from "$lib/stores/filterStore";

    let { onOpenAddModal = () => {} } = $props();

    const now = new Date();
    const currentDateStr = now.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const navItems = [
        {
            href: "/",
            icon: "🔔",
            label: "Notice Harian",
            badge: () => $statsStore.notice + $statsStore.jatuh_tempo,
        },
        { href: "/records", icon: "📋", label: "Data Tangki", badge: null },
        { href: "/gallery", icon: "📁", label: "Directory Foto", badge: null },
        {
            href: "/analytics",
            icon: "📊",
            label: "Analisis Group",
            badge: null,
        },
        {
            href: "/stock",
            icon: "🏷️",
            label: "Kelola Filter",
            badge: null,
        },
    ];
</script>

<header
    class="sticky top-0 z-50 border-b border-slate-800/60"
    style="background: rgba(8,12,20,0.85); backdrop-filter: blur(20px);"
>
    <div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-[62px]">
            <!-- Brand -->
            <a href="/" class="flex items-center gap-3 group shrink-0">
                <div class="relative">
                    <div
                        class="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-base shadow-lg shadow-sky-500/25 group-hover:shadow-sky-500/40 transition-all"
                    >
                        🛢️
                    </div>
                    <div
                        class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#080C14]"
                    ></div>
                </div>
                <div class="hidden sm:block">
                    <div
                        class="text-[15px] font-bold text-white tracking-tight leading-none"
                    >
                        FilterGuard
                    </div>
                    <div class="text-[10px] text-slate-500 leading-none mt-0.5">
                        Tank Filter Monitoring
                    </div>
                </div>
            </a>

            <!-- Navigation -->
            <nav class="hidden lg:flex items-center gap-0.5">
                {#each navItems as item}
                    {@const isActive = page.url.pathname === item.href}
                    {@const badge = item.badge ? item.badge() : 0}
                    <a
                        href={item.href}
                        class="relative px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-1.5 {isActive
                            ? 'text-white bg-slate-800/80'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
                    >
                        <span class="text-[13px]">{item.icon}</span>
                        <span>{item.label}</span>
                        {#if badge > 0}
                            <span
                                class="px-1.5 py-0.5 rounded-full bg-amber-500 text-[10px] font-bold text-black leading-none animate-pulse"
                            >
                                {badge}
                            </span>
                        {/if}
                        {#if item.soon}
                            <span
                                class="px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400 border border-violet-500/25 text-[9px] font-semibold uppercase tracking-wider"
                            >
                                Soon
                            </span>
                        {/if}
                        {#if isActive}
                            <span
                                class="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-sky-500"
                            ></span>
                        {/if}
                    </a>
                {/each}
            </nav>

            <!-- Right side -->
            <div class="flex items-center gap-2.5">
                <!-- Date chip -->
                <div
                    class="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400"
                >
                    <span>📅</span>
                    <span>{currentDateStr}</span>
                </div>

                <!-- Add button -->
                <button
                    onclick={onOpenAddModal}
                    class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 shadow-lg shadow-sky-600/20 transition-all active:scale-95"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2.5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    <span class="hidden sm:inline">Tambah Tangki</span>
                    <span class="sm:hidden">+</span>
                </button>
            </div>
        </div>
    </div>
</header>
