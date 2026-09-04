<script>
    import '../app.css';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import AddTankModal from '$lib/components/AddTankModal.svelte';
    import NotificationToast from '$lib/components/NotificationToast.svelte';
    import { recordsStore, photoDirectoryStore, groupsStore, filterStockStore } from '$lib/stores/filterStore';
    import { muteStore } from '$lib/stores/notificationStore';
    import { setMuted, playInfoSound } from '$lib/utils/notificationAudio';

    let { children, data } = $props();

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

    // Dynamic margin based on sidebar state
    let contentMargin = $derived(sidebarOpen ? '240px' : '64px');
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
    <div class="min-h-screen bg-[#080C14] text-slate-100" style="font-family: 'Inter', sans-serif;">

        <!-- Sidebar (fixed) -->
        <Sidebar
            bind:isOpen={sidebarOpen}
            onOpenAddModal={handleOpenAddModal}
            currentUser={data?.user}
        />

        <!-- Main content — offset by sidebar width -->
        <div class="flex flex-col min-h-screen transition-all duration-300 ease-in-out" style="margin-left: {contentMargin};">

            <!-- Top bar (thin) -->
            <div class="sticky top-0 z-30 border-b border-slate-800/50 px-6 flex items-center justify-between h-[52px]"
                 style="background: rgba(8,12,20,0.92); backdrop-filter: blur(16px);">
                <!-- Breadcrumb page title comes from child pages -->
                <div class="text-xs text-slate-600 font-semibold tracking-widest uppercase flex items-center gap-2">
                    <span>PT. Anugerah Rezeki Teknindo</span>
                    {#if data?.user}
                        <span class="text-slate-800">·</span>
                        <span class="text-sky-500/80 font-mono text-[11px] lowercase">@{data.user.username}</span>
                    {/if}
                </div>
                <div class="flex items-center gap-3">
                    <button
                        type="button"
                        onclick={() => {
                            const newMuted = !$muteStore;
                            muteStore.set(newMuted);
                            setMuted(newMuted);
                            if (!newMuted) playInfoSound();
                        }}
                        class="px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all {$muteStore ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400' : 'bg-sky-500/10 border-sky-500/25 text-sky-400 hover:bg-sky-500/20'}"
                        title={$muteStore ? 'Suara notifikasi mati — Klik untuk membunyikan nada dering' : 'Suara notifikasi aktif — Klik untuk membisukan'}
                    >
                        <span>{$muteStore ? '🔕' : '🔔'}</span>
                        <span class="hidden sm:inline">{$muteStore ? 'Muted' : 'Audio On'}</span>
                    </button>
                    <div class="text-[10px] text-slate-600 font-mono">
                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            <!-- Page content -->
            <main class="flex-1 px-6 py-7 max-w-[1400px] w-full mx-auto">
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

