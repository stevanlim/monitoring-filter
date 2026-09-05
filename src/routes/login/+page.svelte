<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import YetiMascot from '$lib/components/YetiMascot.svelte';
    import ThemeSelector from '$lib/components/ThemeSelector.svelte';
    import { themeMode, accentColor, initTheme } from '$lib/stores/themeStore.js';

    // Step state: 1 = Username & Password, 2 = PIN 6-Digit
    let step = $state(1);

    // Step 1 Form Data
    let username = $state('');
    let password = $state('');
    let showPassword = $state(false);

    // Step 2 Form Data (PIN 6-digit)
    let pinDigits = $state(['', '', '', '', '', '']);
    let tempToken = $state('');
    let pinInputs = [];

    // UI state
    let isLoading = $state(false);
    let errorMessage = $state('');
    let isShaking = $state(false);
    let mascotMode = $state('idle'); // 'idle' | 'username' | 'password' | 'peek' | 'pin' | 'success' | 'error'

    onMount(() => {
        initTheme();
    });

    // Update mascot mode based on password visibility & focus
    function handleUsernameFocus() {
        if (mascotMode !== 'success') mascotMode = 'username';
    }

    function handleUsernameBlur() {
        if (mascotMode === 'username') mascotMode = 'idle';
    }

    function handlePasswordFocus() {
        if (mascotMode !== 'success') {
            mascotMode = showPassword ? 'peek' : 'password';
        }
    }

    function handlePasswordBlur() {
        if (mascotMode === 'password' || mascotMode === 'peek') {
            mascotMode = 'idle';
        }
    }

    function toggleShowPassword() {
        showPassword = !showPassword;
        if (mascotMode === 'password' || mascotMode === 'peek') {
            mascotMode = showPassword ? 'peek' : 'password';
        }
    }

    function triggerShake() {
        isShaking = true;
        mascotMode = 'error';
        setTimeout(() => {
            isShaking = false;
            if (step === 2) mascotMode = 'pin';
            else mascotMode = 'idle';
        }, 600);
    }

    // Step 1 Submit
    async function handleStep1Submit(e) {
        e.preventDefault();
        if (isLoading) return;

        errorMessage = '';
        isLoading = true;

        try {
            const res = await fetch('/api/auth/login-step1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                errorMessage = data.error || 'Username atau Password salah';
                triggerShake();
                return;
            }

            // Sukses tahap 1 -> pindah ke tahap 2 (PIN)
            tempToken = data.temp_token;
            step = 2;
            mascotMode = 'pin';
            pinDigits = ['', '', '', '', '', ''];

            // Auto focus ke box digit pertama setelah render
            setTimeout(() => {
                if (pinInputs[0]) pinInputs[0].focus();
            }, 100);

        } catch (err) {
            errorMessage = 'Gagal menghubungi server. Periksa koneksi Anda.';
            triggerShake();
        } finally {
            isLoading = false;
        }
    }

    // PIN Digit Input Handlers
    function handlePinInput(index, e) {
        const val = e.target.value.replace(/[^0-9]/g, '');
        pinDigits[index] = val ? val.slice(-1) : '';

        // Auto move to next input if filled
        if (pinDigits[index] && index < 5) {
            pinInputs[index + 1]?.focus();
        }

        // Auto submit jika semua 6 digit terisi
        if (pinDigits.every(d => d !== '')) {
            handleStep2Submit();
        }
    }

    function handlePinKeyDown(index, e) {
        if (e.key === 'Backspace') {
            if (!pinDigits[index] && index > 0) {
                pinDigits[index - 1] = '';
                pinInputs[index - 1]?.focus();
            } else {
                pinDigits[index] = '';
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            pinInputs[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            pinInputs[index + 1]?.focus();
        }
    }

    function handlePinPaste(e) {
        e.preventDefault();
        const pasted = (e.clipboardData?.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6);
        if (pasted) {
            const arr = pasted.split('');
            for (let i = 0; i < 6; i++) {
                pinDigits[i] = arr[i] || '';
            }
            if (pasted.length === 6) {
                handleStep2Submit();
            } else {
                pinInputs[Math.min(pasted.length, 5)]?.focus();
            }
        }
    }

    // Keypad Virtual Click
    function handleKeypadClick(num) {
        const firstEmptyIdx = pinDigits.findIndex(d => d === '');
        if (firstEmptyIdx !== -1) {
            pinDigits[firstEmptyIdx] = String(num);
            if (firstEmptyIdx < 5) {
                pinInputs[firstEmptyIdx + 1]?.focus();
            }
            if (pinDigits.every(d => d !== '')) {
                handleStep2Submit();
            }
        }
    }

    function handleKeypadBackspace() {
        for (let i = 5; i >= 0; i--) {
            if (pinDigits[i] !== '') {
                pinDigits[i] = '';
                pinInputs[i]?.focus();
                break;
            }
        }
    }

    // Step 2 Submit (PIN Verification)
    async function handleStep2Submit(e) {
        if (e) e.preventDefault();
        if (isLoading) return;

        const pin = pinDigits.join('');
        if (pin.length !== 6) {
            errorMessage = 'Masukkan 6 digit PIN Keamanan lengkap';
            triggerShake();
            return;
        }

        errorMessage = '';
        isLoading = true;

        try {
            const res = await fetch('/api/auth/login-step2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temp_token: tempToken, pin })
            });

            const data = await res.json();

            if (!res.ok) {
                errorMessage = data.error || 'PIN Keamanan tidak cocok';
                triggerShake();
                pinDigits = ['', '', '', '', '', ''];
                setTimeout(() => pinInputs[0]?.focus(), 150);
                return;
            }

            // Sukses Login!
            mascotMode = 'success';
            setTimeout(() => {
                window.location.href = '/';
            }, 800);

        } catch (err) {
            errorMessage = 'Terjadi kesalahan sistem saat memverifikasi PIN';
            triggerShake();
        } finally {
            isLoading = false;
        }
    }

    function backToStep1() {
        step = 1;
        mascotMode = 'idle';
        errorMessage = '';
    }
</script>

<svelte:head>
    <title>Login Masuk — PT. Anugerah Rezeki Teknindo</title>
</svelte:head>

<div
    class="min-h-screen transition-colors duration-200 flex flex-col justify-center items-center p-3 sm:p-4 py-8 sm:py-12 relative overflow-hidden select-none"
    style="background: var(--bg-page, #080C14); color: var(--text-main, #f8fafc);"
>
    <!-- Top Right Theme & Accent Selector Widget -->
    <div class="fixed top-3 right-3 sm:top-6 sm:right-6 z-50">
        <ThemeSelector />
    </div>

    <!-- Ambient Glow Blobs -->
    <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-500
        {$accentColor === 'yellow' ? 'bg-amber-500/20' : 'bg-sky-600/15'}"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-500
        {$accentColor === 'yellow' ? 'bg-yellow-500/15' : 'bg-cyan-500/15'}"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none
        {$themeMode === 'light' ? 'bg-slate-300/30' : 'bg-indigo-950/20'}"></div>

    <!-- Container Form -->
    <div class="w-full max-w-[420px] px-1 sm:px-0 relative z-10">

        <!-- Yeti Mascot sitting on top of the card -->
        <div class="mb-[-22px] sm:mb-[-28px] relative z-20 scale-90 sm:scale-100 origin-bottom">
            <YetiMascot
                mode={mascotMode}
                charCount={username.length}
                maxChars={25}
            />
        </div>

        <!-- Login Card -->
        <div
            class="rounded-2xl sm:rounded-3xl border transition-all duration-300 p-5 sm:p-8 shadow-2xl relative
                {$themeMode === 'light' ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#0D1424]/90 border-slate-700/60 text-white backdrop-blur-xl'}
                {isShaking ? 'animate-[wiggle_0.4s_ease-in-out]' : ''}"
            style="box-shadow: 0 25px 50px -12px rgba(0,0,0,{$themeMode === 'light' ? '0.1' : '0.8'}), 0 0 40px {$accentColor === 'yellow' ? 'rgba(245,158,11,0.18)' : 'rgba(56,189,248,0.12)'};"
        >

            <!-- Brand Header -->
            <div class="text-center pt-2 pb-5 border-b {$themeMode === 'light' ? 'border-slate-100' : 'border-slate-800/80'}">
                <div class="text-[11px] font-bold tracking-widest uppercase transition-colors {$accentColor === 'yellow' ? 'text-amber-500' : 'text-sky-400'}">
                    PT. Anugerah Rezeki Teknindo
                </div>
                <h1 class="text-xl sm:text-2xl font-black mt-1 {$themeMode === 'light' ? 'text-slate-900' : 'text-white'}">
                    MicroClean Diesel Filter
                </h1>
                <p class="text-xs mt-1 {$themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}">
                    {step === 1 ? 'Silakan masuk ke panel sistem monitoring' : 'Tahap 2: Verifikasi PIN Keamanan'}
                </p>
            </div>

            <!-- Error Banner -->
            {#if errorMessage}
                <div class="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                    <span class="text-base shrink-0">⚠️</span>
                    <span class="font-medium">{errorMessage}</span>
                </div>
            {/if}

            <!-- ================= STEP 1: USERNAME & PASSWORD ================= -->
            {#if step === 1}
                <form onsubmit={handleStep1Submit} class="space-y-4 mt-5">

                    <!-- Username Field -->
                    <div>
                        <label for="login-username" class="block text-xs font-semibold mb-1.5 {$themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}">
                            Username
                        </label>
                        <div class="relative">
                            <input
                                id="login-username"
                                type="text"
                                bind:value={username}
                                onfocus={handleUsernameFocus}
                                onblur={handleUsernameBlur}
                                required
                                autocomplete="username"
                                placeholder="Masukkan username admin"
                                class="w-full rounded-xl px-4 py-3 text-sm pl-10 transition-all focus:outline-none focus:ring-2
                                    {$themeMode === 'light'
                                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                                        : 'bg-slate-950/80 border border-slate-700/70 text-white placeholder-slate-500'}
                                    {$accentColor === 'yellow'
                                        ? 'focus:border-amber-400 focus:ring-amber-500/20'
                                        : 'focus:border-sky-400 focus:ring-sky-500/20'}"
                            />
                            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base">👤</span>
                        </div>
                    </div>

                    <!-- Password Field with Show/Hide Toggle -->
                    <div>
                        <div class="flex justify-between items-center mb-1.5">
                            <label for="login-password" class="block text-xs font-semibold {$themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}">
                                Password
                            </label>
                            <button
                                type="button"
                                onclick={toggleShowPassword}
                                class="text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer
                                    {$accentColor === 'yellow' ? 'text-amber-500 hover:text-amber-600' : 'text-sky-400 hover:text-sky-300'}"
                            >
                                <span>{showPassword ? '🙈 Sembunyikan' : '👁️ Lihat'}</span>
                            </button>
                        </div>
                        <div class="relative">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                bind:value={password}
                                onfocus={handlePasswordFocus}
                                onblur={handlePasswordBlur}
                                required
                                autocomplete="current-password"
                                placeholder="Masukkan password"
                                class="w-full rounded-xl px-4 py-3 text-sm pl-10 pr-10 transition-all focus:outline-none focus:ring-2
                                    {$themeMode === 'light'
                                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                                        : 'bg-slate-950/80 border border-slate-700/70 text-white placeholder-slate-500'}
                                    {$accentColor === 'yellow'
                                        ? 'focus:border-amber-400 focus:ring-amber-500/20'
                                        : 'focus:border-sky-400 focus:ring-sky-500/20'}"
                            />
                            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base">🔒</span>
                            
                            <button
                                type="button"
                                onclick={toggleShowPassword}
                                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
                                title={showPassword ? 'Tutup mata' : 'Buka intip'}
                            >
                                {showPassword ? '🔓' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button
                        type="submit"
                        disabled={isLoading}
                        class="w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 active:scale-[0.98] cursor-pointer
                            {$accentColor === 'yellow'
                                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                                : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white shadow-lg shadow-sky-500/25'}"
                    >
                        {#if isLoading}
                            <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            Memvalidasi...
                        {:else}
                            <span>Lanjut ke Verifikasi PIN</span>
                            <span>→</span>
                        {/if}
                    </button>

                </form>

            <!-- ================= STEP 2: 6-DIGIT PIN VERIFICATION ================= -->
            {:else if step === 2}
                <div class="mt-5 space-y-5 animate-fadeIn">

                    <div class="text-center">
                        <div class="text-xs {$themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}">
                            Masukkan <span class="font-bold {$accentColor === 'yellow' ? 'text-amber-500' : 'text-sky-400'}">6 Digit PIN Keamanan</span> untuk akun <span class="font-semibold {$themeMode === 'light' ? 'text-slate-900' : 'text-white'}">{username}</span>
                        </div>
                    </div>

                    <!-- 6 Digit Input Boxes -->
                    <div class="flex justify-center gap-1.5 sm:gap-2.5 max-w-full px-0.5" onpaste={handlePinPaste}>
                        {#each pinDigits as digit, idx}
                            <input
                                bind:this={pinInputs[idx]}
                                type="password"
                                inputmode="numeric"
                                maxlength="1"
                                value={digit}
                                oninput={(e) => handlePinInput(idx, e)}
                                onkeydown={(e) => handlePinKeyDown(idx, e)}
                                class="w-9 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-2xl font-bold font-mono rounded-xl focus:outline-none focus:ring-2 transition-all
                                    {$themeMode === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950/90 text-white'}
                                    {digit 
                                        ? ($accentColor === 'yellow' ? 'border-2 border-amber-400 text-amber-500 ring-2 ring-amber-500/25' : 'border-2 border-sky-400 text-sky-400 ring-2 ring-sky-500/25') 
                                        : ($themeMode === 'light' ? 'border border-slate-300' : 'border border-slate-700/80')}
                                    {$accentColor === 'yellow' ? 'focus:border-amber-400 focus:ring-amber-500/30' : 'focus:border-sky-400 focus:ring-sky-500/30'}"
                            />
                        {/each}
                    </div>

                    <!-- Visual Keypad Option -->
                    <div class="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[260px] mx-auto pt-1 sm:pt-2">
                        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
                            <button
                                type="button"
                                onclick={() => handleKeypadClick(num)}
                                class="h-10 sm:h-11 rounded-xl font-bold text-base transition-all active:scale-95 flex items-center justify-center shadow-sm cursor-pointer
                                    {$themeMode === 'light'
                                        ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800'
                                        : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white'}"
                            >
                                {num}
                            </button>
                        {/each}
                        <button
                            type="button"
                            onclick={backToStep1}
                            class="h-10 sm:h-11 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center cursor-pointer
                                {$themeMode === 'light'
                                    ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600'
                                    : 'bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-slate-200'}"
                            title="Kembali ke Step 1"
                        >
                            ← Kembali
                        </button>
                        <button
                            type="button"
                            onclick={() => handleKeypadClick(0)}
                            class="h-10 sm:h-11 rounded-xl font-bold text-base transition-all active:scale-95 flex items-center justify-center shadow-sm cursor-pointer
                                {$themeMode === 'light'
                                    ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800'
                                    : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white'}"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onclick={handleKeypadBackspace}
                            class="h-10 sm:h-11 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                            title="Hapus Digit"
                        >
                            ⌫
                        </button>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col gap-2 pt-2">
                        <button
                            type="button"
                            onclick={handleStep2Submit}
                            disabled={isLoading || pinDigits.some(d => d === '')}
                            class="w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer
                                {$accentColor === 'yellow'
                                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25'}"
                        >
                            {#if isLoading}
                                <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                Memverifikasi PIN...
                            {:else}
                                <span>🔓 Verifikasi & Masuk</span>
                            {/if}
                        </button>

                        <button
                            type="button"
                            onclick={backToStep1}
                            class="w-full py-2 text-xs transition-colors text-center font-medium cursor-pointer
                                {$themeMode === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'}"
                        >
                            Ganti Akun / Ubah Password
                        </button>
                    </div>

                </div>
            {/if}

            <!-- Footer Security Note -->
            <div class="mt-6 pt-4 border-t text-center text-[11px] flex items-center justify-center gap-1.5
                {$themeMode === 'light' ? 'border-slate-100 text-slate-400' : 'border-slate-800/60 text-slate-500'}">
                <span>🛡️</span>
                <span>Dilindungi Autentikasi Ganda 2-Tahap</span>
            </div>

        </div>

        <!-- Footer Copyright -->
        <div class="text-center mt-6 text-xs {$themeMode === 'light' ? 'text-slate-500' : 'text-slate-600'}">
            &copy; 2026 PT. Anugerah Rezeki Teknindo · All Rights Reserved
        </div>

    </div>

</div>

<style>
    @keyframes wiggle {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
    }
</style>
