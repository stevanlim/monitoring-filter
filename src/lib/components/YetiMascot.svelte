<script>
    /**
     * YetiMascot.svelte
     * Interactive animated Yeti Mascot inspired by CodeMyUI
     * Designed for Dark Mode with reactive gaze tracking, eye covering, and peeking.
     */
    let {
        mode = "idle", // 'idle' | 'username' | 'password' | 'peek' | 'pin' | 'success' | 'error'
        charCount = 0, // Posisi ketikan untuk kalkulasi sudut mata
        maxChars = 25,
    } = $props();

    // Kalkulasi pergeseran pupil mata berdasarkan panjang teks
    let eyeAngle = $derived.by(() => {
        if (mode !== "username") return { x: 0, y: 0 };
        // Gerakan mata melirik ke bawah dan bergerak dari kiri ke kanan mengikuti ketikan
        const progress = Math.min(Math.max(charCount / maxChars, 0), 1);
        const x = (progress - 0.5) * 16; // -8px to +8px
        const y = 8; // Selalu melirik ke bawah ke arah input field
        return { x, y };
    });

    // Otomatis kedip berkala jika dalam mode idle
    let isBlinking = $state(false);
    $effect(() => {
        const interval = setInterval(() => {
            if (mode === "idle" || mode === "username") {
                isBlinking = true;
                setTimeout(() => {
                    isBlinking = false;
                }, 200);
            }
        }, 3800);
        return () => clearInterval(interval);
    });
</script>

<div
    class="relative w-48 sm:w-56 h-40 mx-auto select-none pointer-events-none transition-transform duration-300"
>
    <svg
        viewBox="0 0 200 160"
        class="w-full h-full overflow-visible drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <!-- Gradient Bulu Yeti Dark Cyberpunk / Navy Slate -->
            <linearGradient id="yetiBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#334155" />
                <stop offset="60%" stop-color="#1e293b" />
                <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>

            <linearGradient id="yetiFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#475569" />
                <stop offset="100%" stop-color="#1e293b" />
            </linearGradient>

            <!-- Glow Cyan / Sky untuk Mata & Aksen -->
            <linearGradient
                id="eyeGlowGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
            >
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="100%" stop-color="#0284c7" />
            </linearGradient>

            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        <!-- Telinga Kiri -->
        <g
            class="transition-transform duration-300 origin-[45px_70px] {mode ===
            'error'
                ? 'animate-bounce'
                : ''}"
        >
            <path
                d="M 45 70 C 25 60 20 40 35 30 C 45 25 55 45 50 65 Z"
                fill="#1e293b"
                stroke="#38bdf8"
                stroke-width="1.5"
                stroke-opacity="0.3"
            />
            <path
                d="M 42 62 C 30 55 28 42 38 35 C 44 32 48 48 45 58 Z"
                fill="#0f172a"
            />
        </g>

        <!-- Telinga Kanan -->
        <g
            class="transition-transform duration-300 origin-[155px_70px] {mode ===
            'error'
                ? 'animate-bounce'
                : ''}"
        >
            <path
                d="M 155 70 C 175 60 180 40 165 30 C 155 25 145 45 150 65 Z"
                fill="#1e293b"
                stroke="#38bdf8"
                stroke-width="1.5"
                stroke-opacity="0.3"
            />
            <path
                d="M 158 62 C 170 55 172 42 162 35 C 156 32 152 48 155 58 Z"
                fill="#0f172a"
            />
        </g>

        <!-- Tanduk / Horns Keren Cyber -->
        <path
            d="M 68 32 C 60 15 50 12 45 15 C 45 25 58 35 65 38 Z"
            fill="#0284c7"
            opacity="0.8"
        />
        <path
            d="M 132 32 C 140 15 150 12 155 15 C 155 25 142 35 135 38 Z"
            fill="#0284c7"
            opacity="0.8"
        />

        <!-- Badan / Kepala Bulu Utama Yeti -->
        <path
            d="M 50 140 
               C 35 110 35 55 65 35 
               C 85 20 115 20 135 35 
               C 165 55 165 110 150 140 
               C 130 155 70 155 50 140 Z"
            fill="url(#yetiBodyGrad)"
            stroke="#475569"
            stroke-width="2"
        />

        <!-- Jambul Bulu Atas -->
        <path
            d="M 90 24 C 95 12 105 12 110 24 C 105 20 95 20 90 24 Z"
            fill="#64748b"
        />

        <!-- Wajah Bagian Dalam (Face Mask) -->
        <path
            d="M 65 75 
               C 60 55 80 48 100 48 
               C 120 48 140 55 135 75 
               C 132 95 120 108 100 108 
               C 80 108 68 95 65 75 Z"
            fill="url(#yetiFaceGrad)"
            stroke="#334155"
            stroke-width="1.5"
        />

        <!-- Pipi Merona / Blush Halus -->
        <ellipse cx="72" cy="85" rx="6" ry="3" fill="#38bdf8" opacity="0.25" />
        <ellipse cx="128" cy="85" rx="6" ry="3" fill="#38bdf8" opacity="0.25" />

        <!-- Hidung Segitiga Bulat -->
        <polygon points="96,78 104,78 100,85" fill="#0f172a" />

        <!-- Mulut Yeti -->
        {#if mode === "success"}
            <!-- Senyum Lebar Bahagia -->
            <path
                d="M 88 90 Q 100 104 112 90"
                stroke="#38bdf8"
                stroke-width="2.5"
                stroke-linecap="round"
                fill="#0f172a"
            />
            <path d="M 94 92 Q 100 97 106 92" fill="#f8fafc" />
        {:else if mode === "error"}
            <!-- Mulut Kaget / Khawatir O -->
            <ellipse
                cx="100"
                cy="94"
                rx="5"
                ry="6"
                fill="#0f172a"
                stroke="#f43f5e"
                stroke-width="1.5"
            />
        {:else if mode === "pin"}
            <!-- Mulut Fokus / Serius O kecil -->
            <ellipse
                cx="100"
                cy="92"
                rx="3.5"
                ry="3.5"
                fill="#0f172a"
                stroke="#38bdf8"
                stroke-width="1.5"
            />
        {:else}
            <!-- Senyum Ramah Santai -->
            <path
                d="M 92 90 Q 100 98 108 90"
                stroke="#94a3b8"
                stroke-width="2"
                stroke-linecap="round"
                fill="none"
            />
        {/if}

        <!-- GIGI TARING KECIL CUTE -->
        <polygon points="93,89 95,94 97,89" fill="#f8fafc" opacity="0.9" />
        <polygon points="103,89 105,94 107,89" fill="#f8fafc" opacity="0.9" />

        <!-- ================= MATA YETI ================= -->
        <g id="yeti-eyes">
            <!-- Mata Kiri (Sclera Putih Terang) -->
            <ellipse
                cx="82"
                cy="68"
                rx="11"
                ry="13"
                fill="#f8fafc"
                stroke="#1e293b"
                stroke-width="1"
            />

            <!-- Mata Kanan (Sclera Putih Terang) -->
            <ellipse
                cx="118"
                cy="68"
                rx="11"
                ry="13"
                fill="#f8fafc"
                stroke="#1e293b"
                stroke-width="1"
            />

            <!-- Pupil & Iris Kiri -->
            <g
                class="transition-all duration-150 ease-out"
                style="transform: translate({eyeAngle.x}px, {eyeAngle.y}px);"
            >
                <circle
                    cx="82"
                    cy="68"
                    r={mode === "pin" ? "7" : "6"}
                    fill="url(#eyeGlowGrad)"
                />
                <circle cx="82" cy="68" r="3.5" fill="#090d16" />
                <circle cx="80" cy="65" r="1.8" fill="#ffffff" />
                <circle cx="84" cy="70" r="0.8" fill="#ffffff" opacity="0.7" />
            </g>

            <!-- Pupil & Iris Kanan -->
            <g
                class="transition-all duration-150 ease-out"
                style="transform: translate({eyeAngle.x}px, {eyeAngle.y}px);"
            >
                <circle
                    cx="118"
                    cy="68"
                    r={mode === "pin" ? "7" : "6"}
                    fill="url(#eyeGlowGrad)"
                />
                <circle cx="118" cy="68" r="3.5" fill="#090d16" />
                <circle cx="116" cy="65" r="1.8" fill="#ffffff" />
                <circle cx="120" cy="70" r="0.8" fill="#ffffff" opacity="0.7" />
            </g>

            <!-- Kelopak Mata (Blink Animation) -->
            <ellipse
                cx="82"
                cy="68"
                rx="12"
                ry={isBlinking ? "14" : "0"}
                fill="#334155"
                class="transition-all duration-100"
            />
            <ellipse
                cx="118"
                cy="68"
                rx="12"
                ry={isBlinking ? "14" : "0"}
                fill="#334155"
                class="transition-all duration-100"
            />
        </g>

        <!-- ================= TANGAN YETI (COVER EYES & PEEK ANIMATION) ================= -->
        <!-- Tangan Kiri -->
        <g
            class="transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
            style="transform-origin: 30px 145px; 
                   transform: {mode === 'password'
                ? 'translate(38px, -65px) rotate(24deg)'
                : mode === 'peek'
                  ? 'translate(36px, -52px) rotate(16deg)'
                  : mode === 'pin'
                    ? 'translate(8px, -12px) rotate(5deg)'
                    : 'translate(0px, 0px) rotate(0deg)'};"
        >
            <!-- Lengan & Cakar Kiri -->
            <path
                d="M 25 140 
                   C 20 120 40 105 60 115 
                   C 68 120 72 135 60 148 
                   C 45 155 30 152 25 140 Z"
                fill="url(#yetiBodyGrad)"
                stroke="#475569"
                stroke-width="1.5"
            />
            <!-- Jari-jari Bulat Cakar Kiri -->
            <circle cx="58" cy="118" r="4.5" fill="#1e293b" />
            <circle cx="67" cy="126" r="4.5" fill="#1e293b" />
            <circle cx="66" cy="136" r="4.5" fill="#1e293b" />
        </g>

        <!-- Tangan Kanan -->
        <g
            class="transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
            style="transform-origin: 170px 145px; 
                   transform: {mode === 'password'
                ? 'translate(-38px, -65px) rotate(-24deg)'
                : mode === 'peek'
                  ? 'translate(-12px, -15px) rotate(-10deg)'
                  : mode === 'pin'
                    ? 'translate(-8px, -12px) rotate(-5deg)'
                    : 'translate(0px, 0px) rotate(0deg)'};"
        >
            <!-- Lengan & Cakar Kanan -->
            <path
                d="M 175 140 
                   C 180 120 160 105 140 115 
                   C 132 120 128 135 140 148 
                   C 155 155 170 152 175 140 Z"
                fill="url(#yetiBodyGrad)"
                stroke="#475569"
                stroke-width="1.5"
            />
            <!-- Jari-jari Bulat Cakar Kanan -->
            <circle cx="142" cy="118" r="4.5" fill="#1e293b" />
            <circle cx="133" cy="126" r="4.5" fill="#1e293b" />
            <circle cx="134" cy="136" r="4.5" fill="#1e293b" />
        </g>

        <!-- Sparkles / Efek Sukses -->
        {#if mode === "success"}
            <g class="animate-pulse">
                <path
                    d="M 40 25 L 43 32 L 50 35 L 43 38 L 40 45 L 37 38 L 30 35 L 37 32 Z"
                    fill="#38bdf8"
                />
                <path
                    d="M 160 25 L 163 32 L 170 35 L 163 38 L 160 45 L 157 38 L 150 35 L 157 32 Z"
                    fill="#38bdf8"
                />
            </g>
        {/if}
    </svg>
</div>
