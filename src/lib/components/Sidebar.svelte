<script>
    import { page } from "$app/state";
    import { statsStore, groupsStore, stockAlertStore } from "$lib/stores/filterStore";

    let {
        onOpenAddModal = () => {},
        isOpen = $bindable(true),
        currentUser = null,
    } = $props();

    let isLoggingOut = $state(false);
    let showLogoutConfirm = $state(false);

    async function handleLogout() {
        isLoggingOut = true;
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
        } catch (e) {
            window.location.href = "/login";
        }
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const navItems = [
        {
            href: "/",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
            label: "Notice Harian",
            badge: () => $statsStore.notice + $statsStore.jatuh_tempo + $stockAlertStore.habis + $stockAlertStore.menipis,
        },
        {
            href: "/records",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
            label: "Data Unit & Filter",
            badge: null,
        },
        {
            href: "/groups",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
            label: "Kelola Group",
            badge: () => $groupsStore.length,
        },
        {
            href: "/stock",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
            label: "Kelola Data Filter",
            badge: () => $stockAlertStore.habis > 0 ? $stockAlertStore.habis : ($stockAlertStore.menipis > 0 ? $stockAlertStore.menipis : null),
        },
        {
            href: "/gallery",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
            label: "Directory Foto",
            badge: null,
        },
        {
            href: "/analytics",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
            label: "Analisis & Grup",
            badge: null,
        },
    ];

    function isActive(href) {
        if (href === "/") return page.url.pathname === "/";
        return page.url.pathname.startsWith(href);
    }
</script>

<!-- Sidebar container -->
<aside
    class="fixed top-0 left-0 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800/80 select-none"
    style="width: {isOpen
        ? '240px'
        : '64px'}; background: rgba(10, 15, 26, 0.96); backdrop-filter: blur(20px);"
>
    <!-- Brand / Header -->
    <div
        class="flex items-center gap-3 px-3.5 py-4 border-b border-slate-800/80 min-h-[65px]"
    >
        <div
            class="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-md shadow-yellow-500/20 bg-yellow-400"
        >
            <img
                src="/images/logo_microclean.png"
                alt="MicroClean Logo"
                class="w-full h-full object-cover"
            />
        </div>
        {#if isOpen}
            <div class="overflow-hidden whitespace-nowrap animate-fadeIn">
                <div
                    class="text-[12px] font-black text-white tracking-wide truncate leading-tight"
                >
                    PT. ANUGERAH REZEKI
                </div>
                <div
                    class="text-[10px] text-sky-400 font-semibold tracking-wider uppercase truncate"
                >
                    MicroClean Filter
                </div>
            </div>
        {/if}
    </div>

    <!-- Navigation links -->
    <nav class="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {#each navItems as item}
            {@const active = isActive(item.href)}
            {@const badgeCount = item.badge ? item.badge() : 0}
            <a
                href={item.href}
                class="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group
                    {active
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-sm shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}"
                title={!isOpen ? item.label : ""}
            >
                <!-- Active bar left -->
                {#if active}
                    <span
                        class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-sky-400"
                    ></span>
                {/if}

                <span
                    class="shrink-0 {active
                        ? 'text-sky-400'
                        : 'text-slate-400 group-hover:text-slate-200'}"
                >
                    {@html item.icon}
                </span>

                {#if isOpen}
                    <span class="truncate flex-1">{item.label}</span>
                    {#if badgeCount > 0}
                        <span
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0
                            {active
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}"
                        >
                            {badgeCount}
                        </span>
                    {/if}
                {:else if badgeCount > 0}
                    <span
                        class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                    ></span>
                {/if}
            </a>
        {/each}
    </nav>

    <!-- Footer section -->
    <div class="border-t border-slate-800/60 p-3 space-y-2">
        <!-- Add filter installation button -->
        <button
            onclick={onOpenAddModal}
            class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white text-[12px] font-bold shadow-lg shadow-sky-600/20 transition-all active:scale-95"
            title={!isOpen ? "Tambah Pemasangan Filter" : ""}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 shrink-0"
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
            {#if isOpen}<span class="truncate">Tambah Pemasangan Filter</span
                >{/if}
        </button>

        <!-- Logout Button -->
        <button
            onclick={() => (showLogoutConfirm = true)}
            class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-[11px] font-semibold"
            title={!isOpen ? "Keluar (Logout)" : ""}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
            </svg>
            {#if isOpen}<span class="truncate">Keluar (Logout)</span>{/if}
        </button>

        <!-- Collapse toggle -->
        <button
            onclick={() => (isOpen = !isOpen)}
            class="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all text-[11px]"
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 transition-transform duration-300 {isOpen
                    ? ''
                    : 'rotate-180'}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
            </svg>
            {#if isOpen}<span>Sembunyikan</span>{/if}
        </button>

        <!-- Date -->
        {#if isOpen}
            <div class="text-center text-[9px] text-slate-700 pt-0.5">
                {dateStr}
            </div>
        {/if}
    </div>
</aside>

<!-- Modal Konfirmasi Logout -->
{#if showLogoutConfirm}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
        <div
            class="bg-[#0D1424] border border-rose-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-left"
        >
            <div
                class="flex items-center gap-3 pb-3 border-b border-slate-800 text-rose-400"
            >
                <div
                    class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-xl shrink-0"
                >
                    🚪
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">
                        Konfirmasi Keluar
                    </h3>
                    <p class="text-[11px] text-slate-400">
                        Sistem Monitoring Filter MicroClean
                    </p>
                </div>
            </div>

            <p class="text-xs text-slate-300 my-4 leading-relaxed">
                Apakah Anda yakin ingin keluar dari sistem? Anda harus
                memasukkan username, password, dan PIN 6-digit kembali untuk
                masuk.
            </p>

            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                    type="button"
                    onclick={() => (showLogoutConfirm = false)}
                    class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onclick={handleLogout}
                    disabled={isLoggingOut}
                    class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {#if isLoggingOut}
                        <span
                            class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        ></span>
                        Keluar...
                    {:else}
                        Ya, Keluar
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
