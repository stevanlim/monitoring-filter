<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { notificationStore } from '$lib/stores/notificationStore';
    import YetiMascot from '$lib/components/YetiMascot.svelte';
    import ThemeSelector from '$lib/components/ThemeSelector.svelte';
    import { themeMode, accentColor, initTheme } from '$lib/stores/themeStore.js';

    let name = $state('');
    let username = $state('');
    let password = $state('');
    let confirmPassword = $state('');
    let pin = $state('');
    let confirmPin = $state('');

    let showPassword = $state(false);
    let showPin = $state(false);

    let isSubmitting = $state(false);
    let errorMessage = $state('');
    let isShaking = $state(false);

    // Mascot State
    let mascotMode = $state('idle'); // 'idle' | 'username' | 'password' | 'peek' | 'pin' | 'success' | 'error'
    let focusedField = $state(''); // 'name' | 'username' | 'password' | 'confirmPassword' | 'pin' | 'confirmPin' | ''

    let mascotCharCount = $derived.by(() => {
        if (focusedField === 'name') return name.length;
        if (focusedField === 'username') return username.length;
        return 0;
    });

    onMount(() => {
        initTheme();
    });

    function handleFieldFocus(field) {
        if (mascotMode === 'success') return;
        focusedField = field;
        if (field === 'name' || field === 'username') {
            mascotMode = 'username';
        } else if (field === 'password' || field === 'confirmPassword') {
            mascotMode = showPassword ? 'peek' : 'password';
        } else if (field === 'pin' || field === 'confirmPin') {
            mascotMode = showPin ? 'peek' : 'pin';
        }
    }

    function handleFieldBlur() {
        if (mascotMode === 'success' || mascotMode === 'error') return;
        focusedField = '';
        mascotMode = 'idle';
    }

    function toggleShowPassword() {
        showPassword = !showPassword;
        if (focusedField === 'password' || focusedField === 'confirmPassword') {
            mascotMode = showPassword ? 'peek' : 'password';
        }
    }

    function toggleShowPin() {
        showPin = !showPin;
        if (focusedField === 'pin' || focusedField === 'confirmPin') {
            mascotMode = showPin ? 'peek' : 'pin';
        }
    }

    function triggerError(msg) {
        errorMessage = msg;
        isShaking = true;
        mascotMode = 'error';
        setTimeout(() => {
            isShaking = false;
            if (focusedField === 'name' || focusedField === 'username') mascotMode = 'username';
            else if (focusedField === 'password' || focusedField === 'confirmPassword') mascotMode = showPassword ? 'peek' : 'password';
            else if (focusedField === 'pin' || focusedField === 'confirmPin') mascotMode = showPin ? 'peek' : 'pin';
            else mascotMode = 'idle';
        }, 650);
    }

    async function handleRegister(e) {
        e.preventDefault();
        if (isSubmitting) return;

        errorMessage = '';

        // Validasi
        if (!name.trim()) {
            triggerError('Nama Lengkap / Perusahaan wajib diisi.');
            return;
        }

        const cleanUsername = username.trim().toLowerCase();
        if (!cleanUsername || cleanUsername.length < 3) {
            triggerError('Username minimal terdiri dari 3 karakter.');
            return;
        }

        if (password.length < 6) {
            triggerError('Password minimal terdiri dari 6 karakter.');
            return;
        }

        if (password !== confirmPassword) {
            triggerError('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
            return;
        }

        const cleanPin = String(pin).replace(/\D/g, '');
        const cleanConfirmPin = String(confirmPin).replace(/\D/g, '');

        if (cleanPin.length !== 6) {
            triggerError('PIN Keamanan wajib terdiri dari 6 digit angka.');
            return;
        }

        if (cleanPin !== cleanConfirmPin) {
            triggerError('Konfirmasi PIN tidak cocok dengan PIN yang dimasukkan.');
            return;
        }

        isSubmitting = true;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    username: cleanUsername,
                    password: password,
                    pin: cleanPin
                })
            });

            const data = await res.json();

            if (!res.ok) {
                triggerError(data.error || 'Gagal melakukan registrasi akun.');
                isSubmitting = false;
                return;
            }

            mascotMode = 'success';
            notificationStore.success(
                'Akun Berhasil Didaftarkan!',
                `Selamat datang, ${data.user?.name || cleanUsername}. Akun pengelola siap digunakan.`
            );

            // Redirect ke dashboard utama
            setTimeout(() => {
                window.location.href = '/';
            }, 800);

        } catch (err) {
            triggerError('Terjadi gangguan jaringan atau server saat mendaftarkan akun.');
            isSubmitting = false;
        }
    }
</script>

<svelte:head>
    <title>Inisialisasi Akun Pengelola — PT. Anugerah Rezeki Teknindo</title>
</svelte:head>

<div
    class="min-h-screen transition-colors duration-200 flex flex-col justify-center items-center p-3 sm:p-6 py-8 sm:py-12 relative overflow-x-hidden select-none"
    style="background: var(--bg-page, #080C14); color: var(--text-main, #f8fafc);"
>
    <!-- Top Right Theme & Accent Selector Widget -->
    <div class="fixed top-3 right-3 sm:top-6 sm:right-6 z-50">
        <ThemeSelector />
    </div>

    <!-- Ambient Glow Blobs -->
    <div class="fixed -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-500
        {$accentColor === 'yellow' ? 'bg-amber-500/20' : 'bg-sky-600/15'}"></div>
    <div class="fixed -bottom-40 -right-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-500
        {$accentColor === 'yellow' ? 'bg-yellow-500/15' : 'bg-cyan-500/15'}"></div>
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none
        {$themeMode === 'light' ? 'bg-slate-300/30' : 'bg-indigo-950/20'}"></div>

    <!-- Container Form -->
    <div class="w-full max-w-xl relative z-10 my-4 sm:my-8 px-1 sm:px-0">

        <!-- Yeti Mascot sitting on top of the card -->
        <div class="mb-[-22px] sm:mb-[-28px] relative z-20 scale-90 sm:scale-100 origin-bottom">
            <YetiMascot
                mode={mascotMode}
                charCount={mascotCharCount}
                maxChars={25}
            />
        </div>

        <!-- Registration Card -->
        <div
            class="rounded-2xl sm:rounded-3xl border transition-all duration-300 p-5 sm:p-8 shadow-2xl relative space-y-6
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
                    Inisialisasi Akun Pengelola
                </h1>
                <p class="text-xs mt-1 {$themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}">
                    Pendaftaran mandiri satu kali saat sistem pertama kali dipasang
                </p>

                <!-- Badge Sekali Saja -->
                <div class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold
                    {$accentColor === 'yellow' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500' : 'bg-sky-500/15 border border-sky-500/30 text-sky-400'}">
                    <span>✨</span>
                    <span>Registrasi Sekali Saja (Akan Terkunci Otomatis)</span>
                </div>
            </div>

            <!-- Error Banner -->
            {#if errorMessage}
                <div class="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                    <span class="text-base shrink-0">⚠️</span>
                    <span class="font-medium">{errorMessage}</span>
                </div>
            {/if}

            <form onsubmit={handleRegister} novalidate class="space-y-5">

                <!-- Section 1: Profil Pengguna -->
                <div class="space-y-3.5">
                    <div class="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 {$accentColor === 'yellow' ? 'text-amber-500' : 'text-sky-400'}">
                        <span>1. IDENTITAS AKUN</span>
                    </div>

                    <div>
                        <label for="reg-name" class="block text-xs font-semibold mb-1 {$themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}">
                            Nama Lengkap / Nama Perusahaan *
                        </label>
                        <input
                            id="reg-name"
                            type="text"
                            bind:value={name}
                            onfocus={() => handleFieldFocus('name')}
                            onblur={handleFieldBlur}
                            required
                            placeholder="Contoh: Bp. Hendra / PT. Sawit Makmur"
                            class="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2
                                {$themeMode === 'light' ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950/80 border border-slate-800 text-white focus:bg-slate-900'}
                                {$accentColor === 'yellow' ? 'focus:border-amber-400 focus:ring-amber-500/20' : 'focus:border-sky-500 focus:ring-sky-500/20'}"
                        />
                    </div>

                    <div>
                        <label for="reg-username" class="block text-xs font-semibold mb-1 {$themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}">
                            Username Login *
                        </label>
                        <input
                            id="reg-username"
                            type="text"
                            bind:value={username}
                            onfocus={() => handleFieldFocus('username')}
                            onblur={handleFieldBlur}
                            required
                            autocomplete="username"
                            placeholder="Contoh: admin, pengelola, atau nama Anda"
                            class="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2
                                {$themeMode === 'light' ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950/80 border border-slate-800 text-white focus:bg-slate-900'}
                                {$accentColor === 'yellow' ? 'focus:border-amber-400 focus:ring-amber-500/20' : 'focus:border-sky-500 focus:ring-sky-500/20'}"
                        />
                        <span class="text-[10px] mt-1 block {$themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}">
                            Digunakan untuk Login Masuk Tahap 1 (minimal 3 karakter).
                        </span>
                    </div>
                </div>

                <!-- Section 2: Password -->
                <div class="space-y-3.5 pt-3 border-t {$themeMode === 'light' ? 'border-slate-100' : 'border-slate-800/80'}">
                    <div class="flex justify-between items-center">
                        <span class="text-[11px] font-bold uppercase tracking-wider {$accentColor === 'yellow' ? 'text-amber-500' : 'text-sky-400'}">
                            2. KATA SANDI (PASSWORD)
                        </span>
                        <button
                            type="button"
                            onclick={toggleShowPassword}
                            class="text-[11px] font-semibold transition-colors cursor-pointer {$accentColor === 'yellow' ? 'text-amber-500 hover:text-amber-400' : 'text-sky-400 hover:text-sky-300'}"
                        >
                            {showPassword ? '🙈 Sembunyikan' : '👁️ Lihat Password'}
                        </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label for="reg-password" class="block text-xs font-semibold mb-1 {$themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}">
                                Password *
                            </label>
                            <input
                                id="reg-password"
                                type={showPassword ? 'text' : 'password'}
                                bind:value={password}
                                onfocus={() => handleFieldFocus('password')}
                                onblur={handleFieldBlur}
                                required
                                minlength="6"
                                placeholder="Minimal 6 karakter"
                                class="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2
                                    {$themeMode === 'light' ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950/80 border border-slate-800 text-white focus:bg-slate-900'}
                                    {$accentColor === 'yellow' ? 'focus:border-amber-400 focus:ring-amber-500/20' : 'focus:border-sky-500 focus:ring-sky-500/20'}"
                            />
                        </div>

                        <div>
                            <label for="reg-confirm-password" class="block text-xs font-semibold mb-1 {$themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}">
                                Konfirmasi Password *
                            </label>
                            <input
                                id="reg-confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                bind:value={confirmPassword}
                                onfocus={() => handleFieldFocus('confirmPassword')}
                                onblur={handleFieldBlur}
                                required
                                minlength="6"
                                placeholder="Ketik ulang password"
                                class="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2
                                    {$themeMode === 'light' ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950/80 border border-slate-800 text-white focus:bg-slate-900'}
                                    {$accentColor === 'yellow' ? 'focus:border-amber-400 focus:ring-amber-500/20' : 'focus:border-sky-500 focus:ring-sky-500/20'}"
                            />
                        </div>
                    </div>
                </div>

                <!-- Section 3: PIN Keamanan 6 Digit -->
                <div class="space-y-3.5 pt-3 border-t {$themeMode === 'light' ? 'border-slate-100' : 'border-slate-800/80'}">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <span class="text-[11px] font-bold uppercase tracking-wider {$accentColor === 'yellow' ? 'text-amber-500' : 'text-sky-400'}">
                                3. PIN KEAMANAN 6 DIGIT
                            </span>
                            <span class="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                Khusus Angka
                            </span>
                        </div>
                        <button
                            type="button"
                            onclick={toggleShowPin}
                            class="text-[11px] font-semibold transition-colors cursor-pointer {$accentColor === 'yellow' ? 'text-amber-500 hover:text-amber-400' : 'text-sky-400 hover:text-sky-300'}"
                        >
                            {showPin ? '🙈 Sembunyikan' : '👁️ Lihat PIN'}
                        </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label for="reg-pin" class="block text-xs font-semibold mb-1 {$themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}">
                                PIN Keamanan (6 Digit Angka) *
                            </label>
                            <input
                                id="reg-pin"
                                type={showPin ? 'text' : 'password'}
                                inputmode="numeric"
                                maxlength="6"
                                value={pin}
                                oninput={(e) => {
                                    pin = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    e.target.value = pin;
                                }}
                                onfocus={() => handleFieldFocus('pin')}
                                onblur={handleFieldBlur}
                                required
                                placeholder="•••••• (6 Digit Angka)"
                                class="w-full px-4 py-2.5 rounded-xl text-base font-mono tracking-widest text-center transition-all focus:outline-none focus:ring-2
                                    {$themeMode === 'light' ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950/80 border border-slate-800 text-amber-300 focus:bg-slate-900'}
                                    {$accentColor === 'yellow' ? 'focus:border-amber-400 focus:ring-amber-500/20 text-amber-500' : 'focus:border-sky-500 focus:ring-sky-500/20'}"
                            />
                        </div>

                        <div>
                            <label for="reg-confirm-pin" class="block text-xs font-semibold mb-1 {$themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}">
                                Konfirmasi PIN (6 Digit) *
                            </label>
                            <input
                                id="reg-confirm-pin"
                                type={showPin ? 'text' : 'password'}
                                inputmode="numeric"
                                maxlength="6"
                                value={confirmPin}
                                oninput={(e) => {
                                    confirmPin = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    e.target.value = confirmPin;
                                }}
                                onfocus={() => handleFieldFocus('confirmPin')}
                                onblur={handleFieldBlur}
                                required
                                placeholder="•••••• (Ketik ulang)"
                                class="w-full px-4 py-2.5 rounded-xl text-base font-mono tracking-widest text-center transition-all focus:outline-none focus:ring-2
                                    {$themeMode === 'light' ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950/80 border border-slate-800 text-amber-300 focus:bg-slate-900'}
                                    {$accentColor === 'yellow' ? 'focus:border-amber-400 focus:ring-amber-500/20 text-amber-500' : 'focus:border-sky-500 focus:ring-sky-500/20'}"
                            />
                        </div>
                    </div>

                    <p class="text-[11px] leading-relaxed p-3 rounded-xl border
                        {$themeMode === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800/80 text-slate-400'}">
                        💡 <strong>Catatan Penting:</strong> PIN 6-digit ini akan digunakan pada <em>Login Tahap 2</em> dan konfirmasi tindakan sensitif (seperti reaktivasi status tangki). Harap dicatat dan disimpan baik-baik.
                    </p>
                </div>

                <!-- Masa Expire Info (1 Jam) -->
                <div class="flex items-center gap-2.5 p-3 rounded-xl border text-xs
                    {$accentColor === 'yellow' ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-300' : 'bg-sky-500/10 border-sky-500/25 text-sky-600 dark:text-sky-300'}">
                    <span class="text-base shrink-0">⏱️</span>
                    <span><strong>Masa Sesi Login:</strong> Setiap sesi login aktif selama <strong>1 jam (60 menit)</strong>. Setelah 1 jam, sistem otomatis meminta login ulang demi perlindungan keamanan data.</span>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    disabled={isSubmitting}
                    class="w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 active:scale-[0.98] cursor-pointer
                        {$accentColor === 'yellow'
                            ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                            : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white shadow-lg shadow-sky-500/25'}"
                >
                    {#if isSubmitting}
                        <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        <span>Mendaftarkan Akun & Membuka Sistem...</span>
                    {:else}
                        <span>🚀 Simpan Akun & Mulai Monitoring</span>
                        <span>→</span>
                    {/if}
                </button>

            </form>

        </div>

        <div class="text-center mt-6 text-xs {$themeMode === 'light' ? 'text-slate-500' : 'text-slate-600'}">
            MicroClean Diesel Filter Monitoring &copy; 2026 PT. Anugerah Rezeki Teknindo
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
