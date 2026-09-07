<script>
    import { goto } from '$app/navigation';
    import { notificationStore } from '$lib/stores/notificationStore';

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

    async function handleRegister(e) {
        e.preventDefault();
        if (isSubmitting) return;

        errorMessage = '';

        // Validasi
        if (!name.trim()) {
            errorMessage = 'Nama Lengkap / Perusahaan wajib diisi.';
            return;
        }

        const cleanUsername = username.trim().toLowerCase();
        if (!cleanUsername || cleanUsername.length < 3) {
            errorMessage = 'Username minimal 3 karakter.';
            return;
        }

        if (password.length < 6) {
            errorMessage = 'Password minimal terdiri dari 6 karakter.';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage = 'Konfirmasi password tidak cocok dengan password.';
            return;
        }

        const cleanPin = pin.trim();
        if (!/^\d{6}$/.test(cleanPin)) {
            errorMessage = 'PIN Keamanan harus persis berupa 6 digit angka.';
            return;
        }

        if (cleanPin !== confirmPin.trim()) {
            errorMessage = 'Konfirmasi PIN tidak cocok dengan PIN yang dimasukkan.';
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
                errorMessage = data.error || 'Gagal melakukan registrasi.';
                isSubmitting = false;
                return;
            }

            notificationStore.success(
                'Akun Berhasil Didaftarkan!',
                `Selamat datang, ${data.user?.name || cleanUsername}. Akun pengelola siap digunakan.`
            );

            // Redirect ke dashboard utama
            setTimeout(() => {
                goto('/');
            }, 600);

        } catch (err) {
            errorMessage = 'Terjadi gangguan jaringan atau server saat mendaftarkan akun.';
            isSubmitting = false;
        }
    }
</script>

<svelte:head>
    <title>Inisialisasi Akun Pengelola — MicroClean Diesel Filter</title>
</svelte:head>

<div class="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-x-hidden selection:bg-sky-500 selection:text-white">

    <!-- Subtle background glow -->
    <div class="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="fixed bottom-10 right-1/4 w-[400px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-xl relative z-10 my-8">

        <!-- Logo & Header -->
        <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl mb-3">
                <img
                    src="/favicon.ico"
                    alt="MicroClean Logo"
                    class="w-10 h-10 object-contain drop-shadow"
                    onetime-error={() => {}}
                />
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                PT. Anugerah Rezeki Teknindo
            </h1>
            <p class="text-xs text-sky-400 font-medium mt-1">
                MicroClean Diesel Filter Monitoring System
            </p>

            <!-- Badge Sekali Saja -->
            <div class="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold shadow-lg shadow-cyan-500/10">
                <span>✨</span>
                <span>Pendaftaran Akun Konsumen (Inisialisasi Pertama Kali)</span>
            </div>
        </div>

        <!-- Registration Card -->
        <div class="rounded-3xl border border-slate-800/80 bg-[#0d1424]/90 backdrop-blur-xl p-5 sm:p-8 shadow-2xl space-y-6">

            <div class="border-b border-slate-800/80 pb-4">
                <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>🔐</span> Buat Akun Pengelola Utama
                </h2>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">
                    Halaman ini hanya muncul sekali saat sistem pertama kali dipasang. Silakan tentukan Username, Password, dan PIN Keamanan Anda sendiri.
                </p>
            </div>

            <!-- Error Banner -->
            {#if errorMessage}
                <div class="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <span class="text-base shrink-0">⚠️</span>
                    <span class="font-medium mt-0.5">{errorMessage}</span>
                </div>
            {/if}

            <form onsubmit={handleRegister} class="space-y-5">

                <!-- Section 1: Profil Pengguna -->
                <div class="space-y-4">
                    <div class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span>1. IDENTITAS AKUN</span>
                    </div>

                    <div>
                        <label for="name" class="block text-xs font-semibold text-slate-300 mb-1.5">
                            Nama Lengkap / Nama Perusahaan *
                        </label>
                        <input
                            id="name"
                            type="text"
                            bind:value={name}
                            required
                            placeholder="Contoh: Bp. Hendra / PT. Sawit Makmur"
                            class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label for="username" class="block text-xs font-semibold text-slate-300 mb-1.5">
                            Username Login *
                        </label>
                        <input
                            id="username"
                            type="text"
                            bind:value={username}
                            required
                            autocomplete="username"
                            placeholder="Contoh: admin, pengelola, atau nama Anda"
                            class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <span class="text-[10px] text-slate-500 mt-1 block">Digunakan pada Login Tahap 1.</span>
                    </div>
                </div>

                <!-- Section 2: Password -->
                <div class="space-y-4 pt-2 border-t border-slate-800/60">
                    <div class="flex justify-between items-center">
                        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            2. KATA SANDI (PASSWORD)
                        </span>
                        <button
                            type="button"
                            onclick={() => showPassword = !showPassword}
                            class="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                        >
                            {showPassword ? 'Sembunyikan' : 'Lihat'}
                        </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label for="password" class="block text-xs font-semibold text-slate-300 mb-1.5">
                                Password *
                            </label>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                bind:value={password}
                                required
                                minlength="6"
                                placeholder="Minimal 6 karakter"
                                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label for="confirm-password" class="block text-xs font-semibold text-slate-300 mb-1.5">
                                Konfirmasi Password *
                            </label>
                            <input
                                id="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                bind:value={confirmPassword}
                                required
                                minlength="6"
                                placeholder="Ketik ulang password"
                                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <!-- Section 3: PIN Keamanan 6 Digit -->
                <div class="space-y-4 pt-2 border-t border-slate-800/60">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                3. PIN KEAMANAN 6 DIGIT
                            </span>
                            <span class="text-[10px] text-amber-400 block mt-0.5">Wajib angka 6-digit</span>
                        </div>
                        <button
                            type="button"
                            onclick={() => showPin = !showPin}
                            class="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                        >
                            {showPin ? 'Sembunyikan' : 'Lihat'}
                        </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label for="pin" class="block text-xs font-semibold text-slate-300 mb-1.5">
                                PIN Keamanan (6 Digit) *
                            </label>
                            <input
                                id="pin"
                                type={showPin ? 'text' : 'password'}
                                inputmode="numeric"
                                maxlength="6"
                                pattern="\d{6}"
                                bind:value={pin}
                                required
                                placeholder="•••••• (6 Digit Angka)"
                                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-base font-mono tracking-widest text-center text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                        </div>

                        <div>
                            <label for="confirm-pin" class="block text-xs font-semibold text-slate-300 mb-1.5">
                                Konfirmasi PIN (6 Digit) *
                            </label>
                            <input
                                id="confirm-pin"
                                type={showPin ? 'text' : 'password'}
                                inputmode="numeric"
                                maxlength="6"
                                pattern="\d{6}"
                                bind:value={confirmPin}
                                required
                                placeholder="•••••• (Ketik ulang)"
                                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-base font-mono tracking-widest text-center text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                        </div>
                    </div>

                    <p class="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        💡 <strong>Catatan Penting:</strong> PIN 6-digit ini akan digunakan pada <em>Login Tahap 2</em> dan konfirmasi tindakan sensitif (seperti reaktivasi unit tangki). Harap dicatat dan disimpan baik-baik.
                    </p>
                </div>

                <!-- Masa Expire Info -->
                <div class="flex items-center gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
                    <span class="text-base">⏱️</span>
                    <span><strong>Masa Sesi Login:</strong> Setiap login akan aktif selama <strong>1 jam</strong>. Setelah 1 jam, sistem otomatis meminta login ulang demi perlindungan data.</span>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    disabled={isSubmitting}
                    class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                    {#if isSubmitting}
                        <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Mendaftarkan Akun & Membuka Sistem...</span>
                    {:else}
                        <span>🚀 Simpan Akun & Mulai Monitoring</span>
                    {/if}
                </button>

            </form>

        </div>

        <div class="text-center mt-6 text-xs text-slate-600">
            MicroClean Diesel Filter Monitoring © 2026 PT. Anugerah Rezeki Teknindo
        </div>

    </div>

</div>
