<script>
    import { themeMode, accentColor, setThemeMode, setAccentColor } from '$lib/stores/themeStore';
    import { onMount } from 'svelte';

    let isOpen = $state(false);
    let containerEl = $state(null);

    function toggleDropdown() {
        isOpen = !isOpen;
    }

    function closeDropdown() {
        isOpen = false;
    }

    // Handle click outside to close popover
    onMount(() => {
        function handleClickOutside(event) {
            if (isOpen && containerEl && !containerEl.contains(event.target)) {
                closeDropdown();
            }
        }

        function handleEscape(event) {
            if (event.key === 'Escape' && isOpen) {
                closeDropdown();
            }
        }

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    });
</script>

<div class="relative inline-block text-left" bind:this={containerEl}>
    <!-- Trigger Button -->
    <button
        type="button"
        onclick={toggleDropdown}
        class="px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-2 transition-all cursor-pointer select-none
            {$themeMode === 'dark' 
                ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 shadow-sm' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 shadow-sm'}"
        title="Pengaturan Warna Les & Mode Tampilan"
        aria-expanded={isOpen}
        aria-haspopup="true"
    >
        <!-- Icon & Accent Dot -->
        <span class="relative flex items-center justify-center text-sm">
            {#if $themeMode === 'dark'}
                <span>🌙</span>
            {:else}
                <span>☀️</span>
            {/if}
            <!-- Accent indicator dot -->
            <span
                class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 {$themeMode === 'dark' ? 'border-slate-900' : 'border-white'} {$accentColor === 'yellow' ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)]'}"
            ></span>
        </span>

        <span class="hidden sm:inline font-medium">
            {$themeMode === 'dark' ? 'Dark' : 'Light'} · {$accentColor === 'yellow' ? 'Les Kuning' : 'Les Biru'}
        </span>

        <!-- Chevron arrow -->
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
        >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    </button>

    <!-- Dropdown Popover -->
    {#if isOpen}
        <div
            class="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn select-none
                {$themeMode === 'dark' 
                    ? 'bg-[#0d1424] border border-slate-700/80 text-white' 
                    : 'bg-white border border-slate-200 text-slate-800'}"
            style="box-shadow: 0 20px 40px -10px {$themeMode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.15)'};"
        >
            <!-- Popover Header -->
            <div class="flex items-center justify-between pb-3 border-b {$themeMode === 'dark' ? 'border-slate-800' : 'border-slate-100'}">
                <div class="flex items-center gap-2">
                    <span class="text-base">🎨</span>
                    <div>
                        <h4 class="text-xs font-bold leading-tight">Pengaturan Tampilan</h4>
                        <p class="text-[10px] {$themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}">Pilih warna les & mode favorit Anda</p>
                    </div>
                </div>
                <button
                    type="button"
                    onclick={closeDropdown}
                    class="w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors {$themeMode === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}"
                >
                    ✕
                </button>
            </div>

            <!-- BAGIAN 1: PILIH WARNA LES (BIRU / KUNING) -->
            <div class="pt-3 pb-3 space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider {$themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}">
                        1. Pilih Warna Les / Aksen
                    </span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full {$accentColor === 'yellow' ? 'bg-amber-500/15 text-amber-400' : 'bg-sky-500/15 text-sky-400'}">
                        {$accentColor === 'yellow' ? 'Kuning Aktif' : 'Biru Aktif'}
                    </span>
                </div>

                <div class="grid grid-cols-2 gap-2.5">
                    <!-- Opsi Biru -->
                    <button
                        type="button"
                        onclick={() => setAccentColor('blue')}
                        class="p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer
                            {$accentColor === 'blue'
                                ? ($themeMode === 'dark' 
                                    ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.25)]' 
                                    : 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/20 shadow-sm')
                                : ($themeMode === 'dark' 
                                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900' 
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100')}"
                    >
                        <!-- Top Accent Bar Preview -->
                        <div class="w-full h-1 rounded-full bg-sky-400 mb-2 shadow-[0_0_6px_rgba(14,165,233,0.6)]"></div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="w-3.5 h-3.5 rounded-full bg-sky-400 border border-white/40 shadow-sm"></span>
                                <span class="text-xs font-bold {$accentColor === 'blue' ? 'text-sky-400' : ''}">Les Biru</span>
                            </div>
                            {#if $accentColor === 'blue'}
                                <span class="text-sky-400 text-xs font-bold">✓</span>
                            {/if}
                        </div>
                        <p class="text-[9px] mt-1 {$themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'} leading-tight">
                            Biru Elektrik modern
                        </p>
                    </button>

                    <!-- Opsi Kuning -->
                    <button
                        type="button"
                        onclick={() => setAccentColor('yellow')}
                        class="p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer
                            {$accentColor === 'yellow'
                                ? ($themeMode === 'dark' 
                                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
                                    : 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 shadow-sm')
                                : ($themeMode === 'dark' 
                                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900' 
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100')}"
                    >
                        <!-- Top Accent Bar Preview -->
                        <div class="w-full h-1 rounded-full bg-amber-400 mb-2 shadow-[0_0_6px_rgba(245,158,11,0.6)]"></div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="w-3.5 h-3.5 rounded-full bg-amber-400 border border-white/40 shadow-sm"></span>
                                <span class="text-xs font-bold {$accentColor === 'yellow' ? 'text-amber-400' : ''}">Les Kuning</span>
                            </div>
                            {#if $accentColor === 'yellow'}
                                <span class="text-amber-400 text-xs font-bold">✓</span>
                            {/if}
                        </div>
                        <p class="text-[9px] mt-1 {$themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'} leading-tight">
                            Kuning filter diesel
                        </p>
                    </button>
                </div>
            </div>

            <!-- BAGIAN 2: DI BAWAHNYA DARKMODE & LIGHTMODE -->
            <div class="pt-3 border-t {$themeMode === 'dark' ? 'border-slate-800' : 'border-slate-100'} space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-wider block {$themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}">
                    2. Mode Tampilan
                </span>

                <div class="grid grid-cols-2 gap-2.5">
                    <!-- Opsi Dark Mode -->
                    <button
                        type="button"
                        onclick={() => setThemeMode('dark')}
                        class="p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer
                            {$themeMode === 'dark'
                                ? ($accentColor === 'yellow'
                                    ? 'bg-amber-500/10 border-amber-400 text-white font-bold ring-2 ring-amber-500/20'
                                    : 'bg-sky-500/10 border-sky-400 text-white font-bold ring-2 ring-sky-500/20')
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}"
                    >
                        <div class="flex items-center gap-2.5">
                            <span class="text-base">🌙</span>
                            <div>
                                <div class="text-xs">Dark Mode</div>
                                <div class="text-[9px] font-normal {$themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}">Gelap</div>
                            </div>
                        </div>
                        {#if $themeMode === 'dark'}
                            <span class="text-xs font-bold {$accentColor === 'yellow' ? 'text-amber-400' : 'text-sky-400'}">●</span>
                        {/if}
                    </button>

                    <!-- Opsi Light Mode -->
                    <button
                        type="button"
                        onclick={() => setThemeMode('light')}
                        class="p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer
                            {$themeMode === 'light'
                                ? ($accentColor === 'yellow'
                                    ? 'bg-amber-500/10 border-amber-400 text-slate-900 font-bold ring-2 ring-amber-500/20'
                                    : 'bg-sky-500/10 border-sky-400 text-slate-900 font-bold ring-2 ring-sky-500/20')
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'}"
                    >
                        <div class="flex items-center gap-2.5">
                            <span class="text-base">☀️</span>
                            <div>
                                <div class="text-xs">Light Mode</div>
                                <div class="text-[9px] font-normal {$themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}">Terang</div>
                            </div>
                        </div>
                        {#if $themeMode === 'light'}
                            <span class="text-xs font-bold {$accentColor === 'yellow' ? 'text-amber-500' : 'text-sky-500'}">●</span>
                        {/if}
                    </button>
                </div>
            </div>

            <!-- Footer Hint -->
            <div class="mt-3 pt-2 text-center text-[10px] {$themeMode === 'dark' ? 'text-slate-500 border-t border-slate-800/60' : 'text-slate-400 border-t border-slate-100'}">
                Pilihan otomatis tersimpan di perangkat ini.
            </div>
        </div>
    {/if}
</div>
