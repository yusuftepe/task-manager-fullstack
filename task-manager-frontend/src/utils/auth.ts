export function isTokenValid(token: string | null): boolean {
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const payload = JSON.parse(atob(base64)) as { exp?: number };

        if (payload.exp && Date.now() >= payload.exp * 1000) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}
