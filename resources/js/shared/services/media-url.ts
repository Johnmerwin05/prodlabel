const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function getApiBaseUrl() {
    return import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
}

function getApiOrigin() {
    const apiBaseUrl = getApiBaseUrl();

    if (!/^https?:\/\//i.test(apiBaseUrl)) {
        return null;
    }

    return new URL(apiBaseUrl).origin;
}

export function resolveMediaUrl(url: string | null) {
    if (!url) return null;
    if (/^(blob:|data:)/i.test(url)) return url;

    const apiOrigin = getApiOrigin();

    if (url.startsWith("/")) {
        return new URL(url, apiOrigin ?? window.location.origin).toString();
    }

    try {
        const parsedUrl = new URL(url);

        if (apiOrigin && LOCAL_HOSTS.has(parsedUrl.hostname)) {
            return new URL(`${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`, apiOrigin).toString();
        }

        return parsedUrl.toString();
    } catch {
        return new URL(url, apiOrigin ?? window.location.origin).toString();
    }
}
