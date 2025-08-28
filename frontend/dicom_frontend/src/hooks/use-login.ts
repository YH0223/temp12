// src/hooks/use-login.ts
"use client"

import { useState, useCallback } from "react"
import { apiClient } from "@/lib/api"
import type { AuthResponse } from "@/lib/api"

export function useLogin() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = useCallback(
        async (onSuccess?: () => void) => {
            setError("")
            if (!username || !password) {
                setError("아이디와 비밀번호를 입력하세요.")
                return
            }

            setIsLoading(true)
            try {
                // ✅ 방법1: 전용 메서드 사용 (apiClient.login)
                const res: AuthResponse = await apiClient.login({ username, password })

                // accessToken 존재 여부로 성공 판단 (백엔드 스키마에 맞춰 필요시 수정)
                if (res?.accessToken) {
                    onSuccess?.()
                } else {
                    setError("로그인에 실패했습니다.")
                }
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : "로그인 중 오류가 발생했습니다. 다시 시도해주세요."
                // 서버가 명시적으로 401/자격증명 오류 메시지를 던지면 아래 매핑을 조정
                if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
                    setError("아이디 또는 비밀번호가 올바르지 않습니다.")
                } else {
                    setError(msg)
                }
            } finally {
                setIsLoading(false)
            }
        },
        [username, password]
    )

    return {
        username,
        setUsername,
        password,
        setPassword,
        showPassword,
        setShowPassword,
        isLoading,
        error,
        handleLogin,
    }
}
