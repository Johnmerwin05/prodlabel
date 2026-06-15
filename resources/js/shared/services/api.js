import axios from 'axios';

export const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = window.localStorage.getItem('auth.token') ?? window.sessionStorage.getItem('auth.token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
            window.localStorage.removeItem('auth.token');
            window.sessionStorage.removeItem('auth.token');
            window.location.assign('/login');
        }

        return Promise.reject(error);
    },
);
