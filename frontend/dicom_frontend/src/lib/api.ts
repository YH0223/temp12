// API 클라이언트 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export interface LoginRequest {
    username: string
    password: string
}

export interface SignupRequest {
    username: string
    password: string
    displayName: string
    email?: string
}

export interface AuthResponse {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresInSec: number
    username: string
    displayName: string
}

class ApiClient {
    private baseURL: string

    constructor(baseURL: string) {
        this.baseURL = baseURL
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`
        const token = localStorage.getItem("accessToken")

        const config: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        }

        const response = await fetch(url, config)

        if (response.status === 401) {
            // 토큰 만료 시 자동 갱신 시도
            const refreshed = await this.refreshToken()
            if (refreshed) {
                // 갱신 성공 시 원래 요청 재시도
                const newToken = localStorage.getItem("accessToken")
                config.headers = {
                    ...config.headers,
                    Authorization: `Bearer ${newToken}`,
                }
                const retryResponse = await fetch(url, config)
                if (!retryResponse.ok) {
                    throw new Error(`HTTP error! status: ${retryResponse.status}`)
                }
                return retryResponse.json()
            } else {
                // 갱신 실패 시 로그아웃
                this.logout()
                throw new Error("Authentication failed")
            }
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        return response.json()
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await this.request<AuthResponse>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        })

        // 토큰 저장
        localStorage.setItem("accessToken", response.accessToken)
        localStorage.setItem("refreshToken", response.refreshToken)
        localStorage.setItem("username", response.username)
        localStorage.setItem("displayName", response.displayName)

        return response
    }

    async signup(userData: SignupRequest): Promise<AuthResponse> {
        const response = await this.request<AuthResponse>("/api/auth/signup", {
            method: "POST",
            body: JSON.stringify(userData),
        })

        // 토큰 저장
        localStorage.setItem("accessToken", response.accessToken)
        localStorage.setItem("refreshToken", response.refreshToken)
        localStorage.setItem("username", response.username)
        localStorage.setItem("displayName", response.displayName)

        return response
    }

    async refreshToken(): Promise<boolean> {
        try {
            const refreshToken = localStorage.getItem("refreshToken")
            if (!refreshToken) return false

            const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            })

            if (!response.ok) return false

            const data: AuthResponse = await response.json()
            localStorage.setItem("accessToken", data.accessToken)
            localStorage.setItem("refreshToken", data.refreshToken)

            return true
        } catch {
            return false
        }
    }

    async logout(): Promise<void> {
        try {
            const refreshToken = localStorage.getItem("refreshToken")
            if (refreshToken) {
                await this.request("/api/auth/logout", {
                    method: "POST",
                    body: JSON.stringify({ refreshToken }),
                })
            }
        } catch {
            // 로그아웃 요청 실패해도 로컬 토큰은 삭제
        } finally {
            localStorage.removeItem("accessToken")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("username")
            localStorage.removeItem("displayName")
        }
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem("accessToken")
    }

    getUser() {
        return {
            username: localStorage.getItem("username"),
            displayName: localStorage.getItem("displayName"),
        }
    }
}

export const apiClient = new ApiClient(API_BASE_URL)