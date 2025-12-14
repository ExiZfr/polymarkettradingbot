/**
 * Date and Number Formatting Utilities
 * 
 * Centralized formatting functions to prevent hydration errors
 * by ensuring consistent formatting between server and client.
 */

/**
 * Format timestamp with consistent locale (en-US)
 * Prevents hydration mismatches from locale differences
 */
export const formatTimestamp = (date: Date | string): string => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

/**
 * Format short timestamp (time only)
 */
export const formatTime = (date: Date | string): string => {
    return new Date(date).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

/**
 * Format balance/currency amounts
 * Always uses en-US locale with 2 decimal places
 */
export const formatBalance = (amount: number): string => {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Format large numbers (e.g., volume, trade amounts)
 * Uses en-US locale with no decimals by default
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Format percentage
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
};
