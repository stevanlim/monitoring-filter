<script>
    import { goto } from '$app/navigation';
    import YetiMascot from '$lib/components/YetiMascot.svelte';

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

<div class="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">

    <!-- Ambient Glow Blobs -->
    <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-sky-600/15 blur-[120px] pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-950/20 blur-[150px] pointer-events-none"></div>

    <!-- Container Form -->
    <div class="w-full max-w-md relative z-10">

        <!-- Yeti Mascot sitting on top of the card -->
        <div class="mb-[-28px] relative z-20">
            <YetiMascot
                mode={mascotMode}
                charCount={username.length}
                maxChars={25}
            />
        </div>

        <!-- Login Card -->
        <div
            class="rounded-3xl border border-slate-700/60 bg-[#0D1424]/90 backdrop-blur-xl p-7 sm:p-8 shadow-2xl relative transition-all duration-300 {isShaking ? 'animate-[wiggle_0.4s_ease-in-out]' : ''}"
            style="box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 40px rgba(56,189,248,0.08);"
        >

            <!-- Brand Header -->
            <div class="text-center pt-2 pb-5 border-b border-slate-800/80">
                <div class="text-[11px] font-bold tracking-widest text-sky-400 uppercase">
                    PT. Anugerah Rezeki Teknindo
                </div>
                <h1 class="text-xl sm:text-2xl font-black text-white mt-1">
                    MicroClean Diesel Filter
                </h1>
                <p class="text-xs text-slate-400 mt-1">
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
                        <label for="login-username" class="block text-xs font-semibold text-slate-300 mb-1.5">
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
                                class="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all pl-10"
                            />
                            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base">👤</span>
                        </div>
                    </div>

                    <!-- Password Field with Show/Hide Toggle -->
                    <div>
                        <div class="flex justify-between items-center mb-1.5">
                            <label for="login-password" class="block text-xs font-semibold text-slate-300">
                                Password
                            </label>
                            <button
                                type="button"
                                onclick={toggleShowPassword}
                                class="text-[11px] text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
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
                                class="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all pl-10 pr-10"
                            />
                            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base">🔒</span>
                            
                            <button
                                type="button"
                                onclick={toggleShowPassword}
                                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm"
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
                        class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-sm font-bold shadow-lg shadow-sky-500/25 transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 active:scale-[0.98]"
                    >
                        {#if isLoading}
                            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
                        <div class="text-xs text-slate-400">
                            Masukkan <span class="text-sky-400 font-bold">6 Digit PIN Keamanan</span> untuk akun <span class="text-white font-semibold">{username}</span>
                        </div>
                    </div>

                    <!-- 6 Digit Input Boxes -->
                    <div class="flex justify-center gap-2 sm:gap-2.5" onpaste={handlePinPaste}>
                        {#each pinDigits as digit, idx}
                            <input
                                bind:this={pinInputs[idx]}
                                type="password"
                                inputmode="numeric"
                                maxlength="1"
                                value={digit}
                                oninput={(e) => handlePinInput(idx, e)}
                                onkeydown={(e) => handlePinKeyDown(idx, e)}
                                class="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono bg-slate-950/90 border {digit ? 'border-sky-400 text-sky-400 ring-2 ring-sky-500/20' : 'border-slate-700/80 text-white'} rounded-xl focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all"
                            />
                        {/each}
                    </div>

                    <!-- Visual Keypad Option -->
                    <div class="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-2">
                        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
                            <button
                                type="button"
                                onclick={() => handleKeypadClick(num)}
                                class="h-11 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center shadow-sm"
                            >
                                {num}
                            </button>
                        {/each}
                        <button
                            type="button"
                            onclick={backToStep1}
                            class="h-11 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center"
                            title="Kembali ke Step 1"
                        >
                            ← Kembali
                        </button>
                        <button
                            type="button"
                            onclick={() => handleKeypadClick(0)}
                            class="h-11 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center shadow-sm"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onclick={handleKeypadBackspace}
                            class="h-11 rounded-xl bg-slate-900/40 hover:bg-rose-500/20 border border-slate-800/60 hover:border-rose-500/30 text-rose-400 text-sm font-bold transition-all active:scale-95 flex items-center justify-center"
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
                            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {#if isLoading}
                                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Memverifikasi PIN...
                            {:else}
                                <span>🔓 Verifikasi & Masuk</span>
                            {/if}
                        </button>

                        <button
                            type="button"
                            onclick={backToStep1}
                            class="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors text-center font-medium"
                        >
                            Ganti Akun / Ubah Password
                        </button>
                    </div>

                </div>
            {/if}

            <!-- Footer Security Note -->
            <div class="mt-6 pt-4 border-t border-slate-800/60 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <span>🛡️</span>
                <span>Dilindungi Autentikasi Ganda 2-Tahap</span>
            </div>

        </div>

        <!-- Footer Copyright -->
        <div class="text-center mt-6 text-xs text-slate-600">
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
