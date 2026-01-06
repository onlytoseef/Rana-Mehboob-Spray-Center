import { useCallback } from 'react';

interface UseCurrencyConverterResult {
    convertToPKR: (amount: number, rate: number) => number;
    convertFromPKR: (amount: number, rate: number) => number;
    formatPKR: (amount: number) => string;
    formatCurrency: (amount: number, currency: string) => string;
}

function useCurrencyConverter(): UseCurrencyConverterResult {
    const convertToPKR = useCallback((amount: number, rate: number): number => {
        return Math.round(amount * rate * 100) / 100;
    }, []);

    const convertFromPKR = useCallback((amount: number, rate: number): number => {
        if (rate === 0) return 0;
        return Math.round((amount / rate) * 100) / 100;
    }, []);

    const formatPKR = useCallback((amount: number): string => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }, []);

    const formatCurrency = useCallback((amount: number, currency: string): string => {
        const currencyMap: { [key: string]: string } = {
            'PKR': 'en-PK',
            'USD': 'en-US',
            'EUR': 'de-DE',
            'GBP': 'en-GB',
            'CNY': 'zh-CN',
        };
        
        return new Intl.NumberFormat(currencyMap[currency] || 'en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    }, []);

    return { convertToPKR, convertFromPKR, formatPKR, formatCurrency };
}

export default useCurrencyConverter;
