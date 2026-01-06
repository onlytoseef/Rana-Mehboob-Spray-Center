import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.token = token;
    }
    return config;
});

// ============================================
// SMART CACHING SYSTEM
// ============================================

interface CacheEntry {
    data: unknown;
    timestamp: number;
    expiresAt: number;
}

// Cache storage
const cache = new Map<string, CacheEntry>();

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
    products: 5 * 60 * 1000,      // 5 minutes - products change rarely
    customers: 5 * 60 * 1000,     // 5 minutes
    suppliers: 5 * 60 * 1000,     // 5 minutes
    categories: 10 * 60 * 1000,   // 10 minutes - categories rarely change
    dashboard: 30 * 1000,         // 30 seconds - dashboard needs fresh data
    default: 2 * 60 * 1000,       // 2 minutes default
};

// Endpoints that should be cached
const CACHEABLE_ENDPOINTS = [
    '/products',
    '/customers', 
    '/suppliers',
    '/categories',
    '/dashboard/stats',
];

// Get cache key from URL
const getCacheKey = (url: string): string => url;

// Get cache duration based on endpoint
const getCacheDuration = (url: string): number => {
    if (url.includes('/products')) return CACHE_DURATIONS.products;
    if (url.includes('/customers')) return CACHE_DURATIONS.customers;
    if (url.includes('/suppliers')) return CACHE_DURATIONS.suppliers;
    if (url.includes('/categories')) return CACHE_DURATIONS.categories;
    if (url.includes('/dashboard')) return CACHE_DURATIONS.dashboard;
    return CACHE_DURATIONS.default;
};

// Check if endpoint should be cached
const isCacheable = (url: string, method: string): boolean => {
    if (method.toUpperCase() !== 'GET') return false;
    return CACHEABLE_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// Get cached data
const getFromCache = (key: string): unknown | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    
    return entry.data;
};

// Set cache data
const setCache = (key: string, data: unknown, duration: number): void => {
    const now = Date.now();
    cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + duration,
    });
};

// Invalidate cache by pattern
export const invalidateCache = (pattern?: string): void => {
    if (!pattern) {
        cache.clear();
        return;
    }
    
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
};

// Cached GET request
export const cachedGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const cacheKey = getCacheKey(url);
    
    // Check cache first
    const cachedData = getFromCache(cacheKey);
    if (cachedData !== null) {
        console.log(`📦 Cache hit: ${url}`);
        return cachedData as T;
    }
    
    // Fetch from API
    console.log(`🌐 API call: ${url}`);
    const response = await api.get<T>(url, config);
    
    // Cache the response if cacheable
    if (isCacheable(url, 'GET')) {
        const duration = getCacheDuration(url);
        setCache(cacheKey, response.data, duration);
    }
    
    return response.data;
};

// Auto-invalidate cache on mutations
api.interceptors.response.use((response) => {
    const method = response.config.method?.toUpperCase();
    const url = response.config.url || '';
    
    // Invalidate related cache on POST, PUT, DELETE
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        if (url.includes('/products')) invalidateCache('/products');
        if (url.includes('/customers')) invalidateCache('/customers');
        if (url.includes('/suppliers')) invalidateCache('/suppliers');
        if (url.includes('/categories')) invalidateCache('/categories');
        if (url.includes('/sales')) {
            invalidateCache('/dashboard');
            invalidateCache('/products'); // Sales affect product stock
        }
        if (url.includes('/imports')) {
            invalidateCache('/dashboard');
            invalidateCache('/products'); // Imports affect product stock
        }
        if (url.includes('/returns')) {
            invalidateCache('/dashboard');
            invalidateCache('/products'); // Returns affect product stock
        }
        if (url.includes('/payments')) invalidateCache('/dashboard');
    }
    
    return response;
});

export default api;
