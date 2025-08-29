// src/lib/http.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const http = axios.create({
    baseURL,
    withCredentials: false, // 쿠키 안 쓰고 Bearer만 쓸 때
});

// 요청 인터셉터: Authorization 자동 부착
http.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let waitQueue: ((t: string) => void)[] = [];

// 응답 인터셉터: 401 → refresh 후 1회 재시도
http.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const { response, config } = error;
        if (!response || !config) return Promise.reject(error);

        // 이미 재시도한 요청은 통과
        const cfg = config as AxiosRequestConfig & { __retry?: boolean };
        if (response.status === 401 && !cfg.__retry) {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) return Promise.reject(error);

            // refresh 동시 호출 방지: 큐잉
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const { data } = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken });
                    localStorage.setItem("accessToken", data.accessToken);
                    localStorage.setItem("refreshToken", data.refreshToken);
                    waitQueue.forEach((fn) => fn(data.accessToken));
                    waitQueue = [];
                } catch (e) {
                    waitQueue = [];
                    // 토큰 정리
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    return Promise.reject(error);
                } finally {
                    isRefreshing = false;
                }
            }

            return new Promise((resolve) => {
                waitQueue.push((newToken: string) => {
                    const retryCfg: AxiosRequestConfig & { __retry?: boolean } = {
                        ...cfg,
                        __retry: true,
                        headers: {
                            ...(cfg.headers ?? {}),
                            Authorization: `Bearer ${newToken}`,
                        },
                    };
                    resolve(http.request(retryCfg));
                });
            });
        }

        return Promise.reject(error);
    }
);