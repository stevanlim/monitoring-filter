import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

// Default initial values
const defaultTheme = 'dark';
const defaultAccent = 'blue'; // 'blue' atau 'yellow'

function getInitialTheme() {
    if (!browser) return defaultTheme;
    try {
        return localStorage.getItem('app_theme_mode') || defaultTheme;
    } catch {
        return defaultTheme;
    }
}

function getInitialAccent() {
    if (!browser) return defaultAccent;
    try {
        return localStorage.getItem('app_accent_color') || defaultAccent;
    } catch {
        return defaultAccent;
    }
}

export const themeMode = writable(getInitialTheme());
export const accentColor = writable(getInitialAccent());

/**
 * Terapkan atribut ke <html> document
 */
function applyToDOM(theme, accent) {
    if (!browser) return;
    const root = document.documentElement;

    // Theme mode (dark / light)
    root.setAttribute('data-theme', theme);
    root.classList.remove('dark', 'light');
    root.classList.add(theme);

    // Accent color (blue / yellow)
    root.setAttribute('data-accent', accent);
    root.classList.remove('accent-blue', 'accent-yellow');
    root.classList.add(`accent-${accent}`);
}

/**
 * Set theme mode ('dark' | 'light')
 */
export function setThemeMode(mode) {
    if (mode !== 'dark' && mode !== 'light') mode = 'dark';
    themeMode.set(mode);
    if (browser) {
        try { localStorage.setItem('app_theme_mode', mode); } catch {}
        applyToDOM(mode, get(accentColor));
    }
}

/**
 * Set accent color ('blue' | 'yellow')
 */
export function setAccentColor(accent) {
    if (accent !== 'blue' && accent !== 'yellow') accent = 'blue';
    accentColor.set(accent);
    if (browser) {
        try { localStorage.setItem('app_accent_color', accent); } catch {}
        applyToDOM(get(themeMode), accent);
    }
}

/**
 * Inisialisasi tema saat aplikasi dimount di browser
 */
export function initTheme() {
    if (!browser) return;
    const currentTheme = getInitialTheme();
    const currentAccent = getInitialAccent();
    themeMode.set(currentTheme);
    accentColor.set(currentAccent);
    applyToDOM(currentTheme, currentAccent);
}
