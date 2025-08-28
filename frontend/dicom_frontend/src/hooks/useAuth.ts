"use client"

import { useState, useCallback, useMemo } from "react"
import { apiClient } from "@/lib/api"

export function useAuth() {
    const [user, setUser] = useState(() => apiClient.getUser())
    const [authed, setAuthed] = useState(() => apiClient.isAuthenticated())

    const login = useCallback(async (cred: { username: string; password: string }) => {
        const res = await apiClient.login(cred)
        setUser(apiClient.getUser())
        setAuthed(true)
        return res
    }, [])

    const signup = useCallback(async (payload: { username: string; password: string; displayName: string; email?: string }) => {
        const res = await apiClient.signup(payload)
        setUser(apiClient.getUser())
        setAuthed(true)
        return res
    }, [])

    const logout = useCallback(async () => {
        await apiClient.logout()
        setUser(apiClient.getUser())
        setAuthed(false)
    }, [])

    return useMemo(() => ({ user, authed, login, signup, logout }), [user, authed, login, signup, logout])
}