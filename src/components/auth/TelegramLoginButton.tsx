"use client"

import { useEffect, useRef } from "react"
import { TelegramUser } from "@/lib/types"

interface TelegramLoginButtonProps {
    botName: string
    onAuth: (user: TelegramUser) => void
    buttonSize?: "large" | "medium" | "small"
    cornerRadius?: number
    requestAccess?: "write"
    className?: string
}

export function TelegramLoginButton({
    botName,
    onAuth,
    buttonSize = "large",
    cornerRadius = 8,
    requestAccess = "write",
    className,
}: TelegramLoginButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        // Define the global callback that Telegram widget calls
        // @ts-ignore
        window.onTelegramAuth = (user: TelegramUser) => {
            onAuth(user)
        }

        const script = document.createElement("script")
        script.src = "https://telegram.org/js/telegram-widget.js?22"
        script.setAttribute("data-telegram-login", botName)
        script.setAttribute("data-size", buttonSize)
        if (cornerRadius) script.setAttribute("data-radius", cornerRadius.toString())
        if (requestAccess) script.setAttribute("data-request-access", requestAccess)
        script.setAttribute("data-onauth", "onTelegramAuth(user)")
        script.async = true

        containerRef.current.innerHTML = ""
        containerRef.current.appendChild(script)

        // Cleanup
        return () => {
            // @ts-ignore
            delete window.onTelegramAuth
        }
    }, [botName, buttonSize, cornerRadius, requestAccess, onAuth])

    return <div ref={containerRef} className={className} />
}
