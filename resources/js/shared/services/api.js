import axios from 'axios';

const AUTH_TOKEN_KEY = 'auth.token';
const AUTH_LAST_ACTIVITY_KEY = 'auth.lastActivityAt';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: import.meta.env.VITE_API_WITH_CREDENTIALS === 'true',
});

api.interceptors.request.use((config) => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY) ?? window.sessionStorage.getItem(AUTH_TOKEN_KEY);
    const lastActivityAt = window.localStorage.getItem(AUTH_LAST_ACTIVITY_KEY) ?? window.sessionStorage.getItem(AUTH_LAST_ACTIVITY_KEY);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (lastActivityAt) {
        config.headers['X-Last-Activity-At'] = lastActivityAt;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
            window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
            window.localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
            window.sessionStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
            window.location.assign('/login');
        }

        return Promise.reject(error);
    },
);
