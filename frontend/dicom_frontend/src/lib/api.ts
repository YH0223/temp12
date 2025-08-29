// src/lib/api.ts
"use client"
import axios, { type AxiosError, type AxiosRequestConfig } from "axios"
import type { PagedResponse, StudySummaryDto, AuthResponse } from "@/types/medical.types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// axios config에 커스텀 플래그를 쓰기 위한 타입 확장 (재선시도 표시)
declare module "axios" {
    export interface AxiosRequestConfig {
        _retry?: boolean
    }
}

class ApiClient {
    private baseURL: string

    // ❌ withCredentials: true (쿠키 미사용 시 불필요)
    // ✅ baseURL는 생성자 인자 사용
    private axiosInstance

    constructor(baseURL: string) {
        this.baseURL = baseURL

        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            withCredentials: false, // ← 서버가 allowCredentials(false) 이므로 false 권장
        })

        // ✅ 요청 인터셉터: 토큰 자동 첨부
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

                if (token) {
                    // headers가 undefined일 수 있으므로 초기화
                    config.headers = config.headers || {};
                    // Authorization 헤더 설정
                    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
                }

                // (선택) 간단 로깅
                // console.debug('[API] →', (config.method || 'GET').toUpperCase(), `${config.baseURL || ''}${config.url || ''}`, { params: config.params });

                return config;
            },
            (err) => Promise.reject(err)
        );

        // ✅ 응답 인터셉터: 401이면 refresh 후 원요청 재시도
        this.axiosInstance.interceptors.response.use(
            (res) => res,
            async (error: AxiosError) => {
                const resp = error.response
                const original = error.config as AxiosRequestConfig

                if (resp?.status === 401 && !original._retry) {
                    original._retry = true
                    const ok = await this.refreshToken()
                    if (ok) {
                        const newToken = localStorage.getItem("accessToken")
                        original.headers = {
                            ...(original.headers || {}),
                            Authorization: `Bearer ${newToken}`,
                        }
                        return this.axiosInstance(original) // 재시도
                    } else {
                        await this.logout()
                    }
                }
                return Promise.reject(error)
            },
        )
    }

    // (login/signup/logout은 fetch 그대로 두셔도 되고, axios로 통일하셔도 됩니다)
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

        const config: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        }

        const res = await fetch(url, config)
        if (res.status === 401) {
            const refreshed = await this.refreshToken()
            if (refreshed) {
                const newToken = localStorage.getItem("accessToken")
                const retryConfig: RequestInit = {
                    ...config,
                    headers: { ...(config.headers || {}), Authorization: `Bearer ${newToken}` },
                }
                const retry = await fetch(url, retryConfig)
                if (!retry.ok) throw new Error(`HTTP error! status: ${retry.status}`)
                return retry.json()
            } else {
                await this.logout()
                throw new Error("Authentication failed")
            }
        }
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
    }

    async login(credentials: { username: string; password: string }) {
        const r = await this.request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) })
        localStorage.setItem("accessToken", r.accessToken)
        localStorage.setItem("refreshToken", r.refreshToken)
        localStorage.setItem("username", r.username)
        localStorage.setItem("displayName", r.displayName)
        return r
    }

    async signup(userData: { username: string; password: string; displayName: string; email?: string }) {
        const r = await this.request<AuthResponse>("/api/auth/signup", { method: "POST", body: JSON.stringify(userData) })
        localStorage.setItem("accessToken", r.accessToken)
        localStorage.setItem("refreshToken", r.refreshToken)
        localStorage.setItem("username", r.username)
        localStorage.setItem("displayName", r.displayName)
        return r
    }

    async refreshToken(): Promise<boolean> {
        try {
            const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null
            if (!refreshToken) return false

            // axios로 해도 되지만, fetch로도 무방
            const res = await fetch(`${this.baseURL}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            })
            if (!res.ok) return false

            const data: AuthResponse = await res.json()
            localStorage.setItem("accessToken", data.accessToken)
            localStorage.setItem("refreshToken", data.refreshToken)
            return true
        } catch {
            return false
        }
    }

    async logout(): Promise<void> {
        try {
            const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null
            if (refreshToken) {
                await this.request("/api/auth/logout", {
                    method: "POST",
                    body: JSON.stringify({ refreshToken }),
                })
            }
        } catch {
            /* ignore */
        } finally {
            localStorage.removeItem("accessToken")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("username")
            localStorage.removeItem("displayName")
        }
    }

    isAuthenticated() {
        return !!(typeof window !== "undefined" && localStorage.getItem("accessToken"))
    }
    getUser() {
        return {
            username: typeof window !== "undefined" ? (localStorage.getItem("username") ?? undefined) : undefined,
            displayName: typeof window !== "undefined" ? (localStorage.getItem("displayName") ?? undefined) : undefined,
        }
    }

    // ✅ 이 메서드는 axiosInstance를 사용하므로 이제 자동으로 Authorization이 붙고, 401이면 자동 리프레시 후 재시도됩니다.
    public async searchDicomStudies(
        params: {
            pid?: string
            pname?: string
            accession?: string
            studyDesc?: string
            modality?: string
            bodyPart?: string
            fromDate?: string
            toDate?: string
        },
        page = 0,
        size = 20,
    ): Promise<PagedResponse<StudySummaryDto>> {
        const res = await this.axiosInstance.get<PagedResponse<StudySummaryDto>>("/api/dicom/query", {
            params: { ...params, page, size },
        })
        return res.data
    }
    // ✅ studyKey로 manifest 조회 (백엔드 엔드포인트에 맞게 경로 조정)
    async getStudyManifest(studyKey: number, onProgress?: (p: number) => void) {
        const res = await this.axiosInstance.get(`/api/studies/${studyKey}/manifest`, {
            onDownloadProgress: (e) => {
                if (e.total) onProgress?.((e.loaded / e.total) * 100);
            },
        });
        return res.data; // 서버의 StudyManifest JSON
    }
}


export const apiClient = new ApiClient(API_BASE_URL)
