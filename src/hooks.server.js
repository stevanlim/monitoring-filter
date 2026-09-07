/**
 * src/hooks.server.js
 * Middleware proteksi route & otentikasi sesi
 */
import { redirect } from '@sveltejs/kit';
import { validateSession, getUserCount } from '$lib/server/authHelper.js';

export async function handle({ event, resolve }) {
    const { url, cookies } = event;
    const pathname = url.pathname;

    const sessionToken = cookies.get('auth_session');
    let sessionUser = null;

    if (sessionToken) {
        sessionUser = await validateSession(sessionToken);
        if (!sessionUser) {
            cookies.delete('auth_session', { path: '/' });
        }
    }

    event.locals.user = sessionUser;

    // Rute publik yang boleh diakses tanpa login
    const isPublicRoute =
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/uploads') ||
        pathname.startsWith('/_app') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt';

    // Cek apakah sistem sudah memiliki akun atau masih kosong (setup awal)
    const userCount = await getUserCount();

    // JIKA SISTEM BELUM MEMILIKI AKUN SAMA SEKALI:
    // Arahkan ke halaman registrasi setup awal sekali saja
    if (userCount === 0) {
        if (pathname !== '/register' && !pathname.startsWith('/api/auth') && !pathname.startsWith('/_app') && pathname !== '/favicon.ico') {
            if (pathname.startsWith('/api/')) {
                return new Response(JSON.stringify({ error: 'Sistem memerlukan inisialisasi akun pengelola di /register' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            throw redirect(303, '/register');
        }
    } else {
        // JIKA SUDAH ADA AKUN:
        // Halaman registrasi dikunci dan dialihkan ke login
        if (pathname === '/register') {
            throw redirect(303, sessionUser ? '/' : '/login');
        }
    }

    // 1. Jika belum login dan mengakses halaman terproteksi
    if (!sessionUser && !isPublicRoute) {
        if (pathname.startsWith('/api/')) {
            return new Response(JSON.stringify({ error: 'Unauthorized. Sesi login telah berakhir atau belum masuk.' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        throw redirect(303, '/login');
    }

    // 2. Jika sudah login dan mencoba mengakses /login atau /register
    if (sessionUser && (pathname === '/login' || pathname === '/register')) {
        throw redirect(303, '/');
    }

    const response = await resolve(event);
    return response;
}
