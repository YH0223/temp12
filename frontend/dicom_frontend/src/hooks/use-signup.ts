"use client"

import type React from "react"
import { useState } from "react"
import { apiClient } from "@/lib/api"
import type { AuthResponse } from "@/lib/api"

interface SignupFormData {
    username: string
    password: string
    confirmPassword: string
    displayName: string            // ✅ 추가
}

export function useSignup() {
    const [formData, setFormData] = useState<SignupFormData>({
        username: "",
        password: "",
        confirmPassword: "",
        displayName: "",             // ✅ 초기값
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const validateForm = () => {
        if (!formData.username || !formData.password || !formData.confirmPassword || !formData.displayName) {
            setError("모든 필수 항목을 입력해주세요.")
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.")
            return false
        }
        if (formData.password.length < 6) {
            setError("비밀번호는 최소 6자 이상이어야 합니다.")
            return false
        }
        return true
    }

    const handleSignup = async (onSuccess?: () => void) => {
        setError("")
        setSuccess("")
        if (!validateForm()) return

        const payload = {
            username: formData.username,
            password: formData.password,
            displayName: formData.displayName,
        }
        console.log("📦 Signup payload:", payload)   // ✅ 실제 전송할 데이터 확인

        setIsLoading(true)
        try {
            const res = await apiClient.signup(payload)
            console.log("✅ Signup response:", res)    // ✅ 서버 응답 로그
            // ...
        } catch (e) {
            console.error("❌ Signup error:", e)
            // ...
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({ username: "", password: "", confirmPassword: "", displayName: "" })
        setError("")
        setSuccess("")
        setShowPassword(false)
        setShowConfirmPassword(false)
    }

    return {
        formData,
        handleInputChange,
        showPassword, setShowPassword,
        showConfirmPassword, setShowConfirmPassword,
        isLoading, error, success,
        handleSignup,
        resetForm,
    }
}
