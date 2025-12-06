"use client";

import { useEffect, useRef } from 'react';

interface TelegramLoginButtonProps {
    botName: string;
    onAuth: (user: any) => void;
    buttonSize?: 'large' | 'medium' | 'small';
    cornerRadius?: number;
    requestAccess?: 'write';
}

export default function TelegramLoginButton({
    botName,
    onAuth,
    buttonSize = 'large',
    cornerRadius = 10,
    requestAccess = 'write',
}: TelegramLoginButtonProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            // Check if script is already there to prevent duplicates
            if (ref.current.innerHTML !== '') return;

            const script = document.createElement('script');
            script.src = 'https://telegram.org/js/telegram-widget.js?22';
            script.setAttribute('data-telegram-login', botName);
            script.setAttribute('data-size', buttonSize);
            script.setAttribute('data-radius', cornerRadius.toString());
            script.setAttribute('data-request-access', requestAccess);
            script.setAttribute('data-userpic', 'false');
            script.async = true;

            // Callback function name
            const callbackName = `onTelegramAuth_${Math.random().toString(36).substr(2, 9)}`;
            script.setAttribute('data-onauth', `window.${callbackName}(user)`);

            // Define the callback on window
            (window as any)[callbackName] = (user: any) => {
                onAuth(user);
            };

            ref.current.appendChild(script);
        }
    }, [botName, onAuth, buttonSize, cornerRadius, requestAccess]);

    return <div ref={ref} className="flex justify-center" />;
}
