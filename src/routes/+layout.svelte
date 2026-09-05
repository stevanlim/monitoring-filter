<script>
    import '../app.css';
    import { onMount } from 'svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import AddTankModal from '$lib/components/AddTankModal.svelte';
    import NotificationToast from '$lib/components/NotificationToast.svelte';
    import ThemeSelector from '$lib/components/ThemeSelector.svelte';
    import { recordsStore, photoDirectoryStore, groupsStore, filterStockStore } from '$lib/stores/filterStore';
    import { muteStore } from '$lib/stores/notificationStore';
    import { setMuted, playInfoSound } from '$lib/utils/notificationAudio';
    import { initTheme } from '$lib/stores/themeStore';

    let { children, data } = $props();

    let windowWidth = $state(1200);
    let isMobile = $derived(windowWidth < 1024);

    onMount(() => {
        initTheme();
        const updateWidth = () => {
            windowWidth = window.innerWidth;
            if (window.innerWidth < 1024) {
                sidebarOpen = false;
            } else {
                sidebarOpen = true;
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    });

    let isAddModalOpen = $state(false);
    let sidebarOpen    = $state(true);

    // Inisialisasi stores dari SSR data
    $effect(() => {
        if (data?.records && data.records.length > 0) {
            recordsStore.init(data.records);
        }
        if (data?.photos) {
            photoDirectoryStore.init(data.photos);
        }
        if (data?.groups && data.groups.length > 0) {
            groupsStore.init(data.groups);
        }
        if (data?.stock && data.stock.length > 0) {
            filterStockStore.init(data.stock);
        }
    });

    function handleOpenAddModal()  { isAddModalOpen = true;  }
    function handleCloseAddModal() { isAddModalOpen = false; }

    // Dynamic margin based on sidebar state (0px on mobile)
    let contentMargin = $derived(isMobile ? '0px' : (sidebarOpen ? '240px' : '64px'));
    let isLoginPage = $derived(data?.pathname === '/login');
</script>

<svelte:head>
    <title>PT. Anugerah Rezeki Teknindo — MicroClean Diesel Filter Monitoring</title>
    <meta name="description" content="Sistem monitoring filter tangki timbun solar MicroClean — notice harian, riwayat maintenance, dan directory foto pergantian filter." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
</svelte:head>

{#if isLoginPage}
    {@render children()}
{:else}
    <div class="min-h-screen transition-colors duration-200" style="background: var(--bg-page, #080C14); color: var(--text-main, #f1f5f9); font-family: 'Inter', sans-serif;">

        <!-- Sidebar (fixed desktop / drawer mobile) -->
        <Sidebar
            bind:isOpen={sidebarOpen}
            onOpenAddModal={handleOpenAddModal}
            currentUser={data?.user}
            isMobile={isMobile}
        />

        <!-- Main content — offset by sidebar width on desktop only -->
        <div class="flex flex-col min-h-screen transition-all duration-300 ease-in-out" style="margin-left: {contentMargin};">

            <!-- Top bar -->
            <div class="sticky top-0 z-30 border-b border-slate-800/50 px-3 sm:px-6 flex items-center justify-between h-[52px] transition-colors duration-200"
                 style="background: var(--bg-topbar, rgba(8,12,20,0.92)); backdrop-filter: blur(16px);">
                
                <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                    {#if isMobile}
                        <button
                            type="button"
                            onclick={() => (sidebarOpen = !sidebarOpen)}
                            class="p-2 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
                            aria-label="Menu navigasi"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    {/if}

                    <!-- Breadcrumb / Header Title -->
                    <div class="text-[11px] sm:text-xs text-slate-500 font-semibold tracking-wider sm:tracking-widest uppercase flex items-center gap-1.5 sm:gap-2 truncate">
                        <span class="truncate">PT. Anugerah Rezeki</span>
                        {#if data?.user}
                            <span class="text-slate-700">·</span>
                            <span class="text-sky-500/80 font-mono text-[10px] sm:text-[11px] lowercase truncate">@{data.user.username}</span>
                        {/if}
                    </div>
                </div>

                <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                    <!-- Theme & Les Accent Selector -->
                    <ThemeSelector />

                    <!-- Audio notification toggle -->
                    <button
                        type="button"
                        onclick={() => {
                            const newMuted = !$muteStore;
                            muteStore.set(newMuted);
                            setMuted(newMuted);
                            if (!newMuted) playInfoSound();
                        }}
                        class="px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer {$muteStore ? 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-400' : 'bg-sky-500/10 border-sky-500/25 text-sky-400 hover:bg-sky-500/20'}"
                        title={$muteStore ? 'Suara notifikasi mati — Klik untuk membunyikan nada dering' : 'Suara notifikasi aktif — Klik untuk membisukan'}
                    >
                        <span>{$muteStore ? '🔕' : '🔔'}</span>
                        <span class="hidden sm:inline">{$muteStore ? 'Muted' : 'Audio On'}</span>
                    </button>
                    <div class="text-[10px] text-slate-500 font-mono hidden md:block">
                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            <!-- Page content -->
            <main class="flex-1 px-3 sm:px-6 py-4 sm:py-6 max-w-[1600px] w-full mx-auto">
                {@render children()}
            </main>

            <!-- Footer -->
            <footer class="border-t border-slate-900 py-4 px-6 text-center text-[10px] text-slate-700">
                MicroClean Diesel Filter Monitoring &copy; 2026 PT Anugerah Rezeki Teknindo
                <span class="mx-2 text-slate-800">·</span>
                Developed by <span class="text-sky-600 font-semibold">Vantzy Web</span>
            </footer>

        </div>

        <AddTankModal isOpen={isAddModalOpen} onClose={handleCloseAddModal} />

        <!-- Global Notification Toast System -->
        <NotificationToast />
    </div>
{/if}

