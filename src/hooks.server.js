/**
 * src/hooks.server.js
 * Middleware proteksi route & otentikasi sesi
 */
import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/authHelper.js';

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
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/uploads') ||
        pathname.startsWith('/_app') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt';

    // 1. Jika belum login dan mengakses halaman terproteksi
    if (!sessionUser && !isPublicRoute) {
        if (pathname.startsWith('/api/')) {
            return new Response(JSON.stringify({ error: 'Unauthorized. Silakan login terlebih dahulu.' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        throw redirect(303, '/login');
    }

    // 2. Jika sudah login dan mencoba mengakses /login
    if (sessionUser && pathname === '/login') {
        throw redirect(303, '/');
    }

    const response = await resolve(event);
    return response;
}
