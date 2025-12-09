"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ToastContainer, ToastProps } from "@/components/ui/Toast";

interface ToastContextType {
    showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
    showSuccessToast: (title: string, message: string) => void;
    showErrorToast: (title: string, message: string) => void;
    showTradeToast: (title: string, market: string, side: string, amount: number, inverse?: boolean) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { ...toast, id, onClose: removeToast }]);
    }, [removeToast]);

    const showSuccessToast = useCallback((title: string, message: string) => {
        showToast({ type: 'success', title, message });
    }, [showToast]);

    const showErrorToast = useCallback((title: string, message: string) => {
        showToast({ type: 'error', title, message });
    }, [showToast]);

    const showTradeToast = useCallback((title: string, market: string, side: string, amount: number, inverse?: boolean) => {
        showToast({
            type: 'trade',
            title,
            message: market,
            tradeData: { market, side, amount, inverse }
        });
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showSuccessToast, showErrorToast, showTradeToast }}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
