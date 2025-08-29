/**
 * 애플리케이션 전역 상태 관리 (실제 API/토큰 기반)
 */
"use client";

import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useEffect,
    ReactNode,
} from "react";
import { ViewMode, Patient, User } from "@/types/medical.types";
import { apiClient } from "@/lib/api"; // ← 실제 ApiClient 사용

// ---- 유틸: JWT 디코드(서명검증 X, 프론트 표시에만 사용) ----
function parseJwt<T = any>(token?: string | null): T | null {
    if (!token) return null;
    try {
        const base64 = token.split(".")[1];
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

function isTokenExpired(token?: string | null): boolean {
    const payload = parseJwt<{ exp?: number }>(token);
    if (!payload?.exp) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
}

function roleFromClaims(roles?: string[] | string): "admin" | "doctor" | "user" {
    const arr = Array.isArray(roles) ? roles : roles ? [roles] : [];
    if (arr.includes("ROLE_ADMIN")) return "admin";
    if (arr.includes("ROLE_DOCTOR")) return "doctor";
    return "user";
}

function permissionsFromRole(role: User["role"]): User["permissions"] {
    switch (role) {
        case "admin":
            return ["VIEW", "EDIT", "DELETE", "ADMIN"];
        case "doctor":
            return ["VIEW", "EDIT"];
        default:
            return ["VIEW"];
    }
}

// ---- 상태 정의 ----
interface AppState {
    isAuthenticated: boolean;
    currentUser: User | null;

    viewMode: ViewMode;
    previousViewMode: ViewMode | null;

    selectedPatient: Patient ;
    patients: Patient[]; // 서버 검색으로 대체 예정이지만, 타입 호환을 위해 유지
    searchTerm: string;
    filteredPatients: Patient[]; // (서버 검색 사용 시 빈 배열 유지)

    isLoading: boolean;
    error: string | null;
}

type AppAction =
    | { type: "LOGIN_SUCCESS"; payload: User }
    | { type: "LOGOUT" }
    | { type: "SET_VIEW_MODE"; payload: ViewMode }
    | { type: "SELECT_PATIENT"; payload: Patient }
    | { type: "SET_SEARCH_TERM"; payload: string }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "CLEAR_ERROR" }
    | { type: "CLEAR_PATIENT_SELECTION" };

const initialState: AppState = {
    isAuthenticated: false,
    currentUser: null,
    viewMode: "login",
    previousViewMode: null,
    selectedPatient: null,
    patients: [], // mock 제거
    searchTerm: "",
    filteredPatients: [],
    isLoading: false,
    error: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case "LOGIN_SUCCESS":
            return {
                ...state,
                isAuthenticated: true,
                currentUser: action.payload,
                viewMode: "main",
                error: null,
            };
        case "LOGOUT":
            return {
                ...initialState,
                patients: [], // 유지할 환자 캐시가 있다면 이 라인에서 채울 수 있음
            };
        case "SET_VIEW_MODE":
            return { ...state, previousViewMode: state.viewMode, viewMode: action.payload };
        case "SELECT_PATIENT":
            return { ...state, selectedPatient: action.payload, viewMode: "viewer" };
        case "SET_SEARCH_TERM":
            // 서버 검색 사용: 로컬 필터는 비활성화(빈 배열 유지)
            return { ...state, searchTerm: action.payload, filteredPatients: [] };
        case "SET_LOADING":
            return { ...state, isLoading: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload, isLoading: false };
        case "CLEAR_ERROR":
            return { ...state, error: null };
        case "CLEAR_PATIENT_SELECTION":
            return { ...state, selectedPatient: null, viewMode: "search" };
        default:
            return state;
    }
};

// ---- 컨텍스트 인터페이스 ----
interface AppContextType {
    state: AppState;

    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;

    navigateTo: (viewMode: ViewMode) => void;
    goBack: () => void;

    selectPatient: (patient: Patient) => void;
    clearPatientSelection: () => void;
    setSearchTerm: (term: string) => void;

    setError: (error: string | null) => void;
    clearError: () => void;

    hasPermission: (permission: string) => boolean;
    isDoctor: () => boolean;
    isAdmin: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ---- Provider ----
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // 첫 로딩: 토큰 기반 자동 로그인
    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token || isTokenExpired(token)) return;

        const payload = parseJwt<{ sub?: string; name?: string; roles?: string[] | string }>(token);
        const username = payload?.sub || apiClient.getUser()?.username || "";
        const displayName = apiClient.getUser()?.displayName || payload?.name || username;
        const role = roleFromClaims(payload?.roles);
        const user: User = {
            id: username,
            username,
            name: displayName,
            role,
            permissions: permissionsFromRole(role),
        };
        dispatch({ type: "LOGIN_SUCCESS", payload: user });
    }, []);

    // 로그인: 실제 API 사용
    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "CLEAR_ERROR" });

        try {
            const res = await apiClient.login({ username, password });
            // accessToken은 apiClient가 저장함. 여기서는 표시/권한만 구성
            const token = localStorage.getItem("accessToken");
            const payload = parseJwt<{ sub?: string; name?: string; roles?: string[] | string }>(token);
            const uname = res.username || payload?.sub || username;
            const dname = res.displayName || payload?.name || uname;
            const role = roleFromClaims((payload as any)?.roles);

            const user: User = {
                id: uname,
                username: uname,
                name: dname,
                role,
                permissions: permissionsFromRole(role),
            };
            dispatch({ type: "LOGIN_SUCCESS", payload: user });
            return true;
        } catch (e) {
            dispatch({ type: "SET_ERROR", payload: "로그인에 실패했습니다." });
            return false;
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    }, []);

    // 로그아웃: 실제 API 사용
    const logout = useCallback(() => {
        try {
            // refreshToken이 있으면 서버에 로그아웃 요청
            apiClient.logout();
        } finally {
            dispatch({ type: "LOGOUT" });
        }
    }, []);

    // 네비게이션
    const navigateTo = useCallback((viewMode: ViewMode) => {
        dispatch({ type: "SET_VIEW_MODE", payload: viewMode });
    }, []);

    const goBack = useCallback(() => {
        // 주의: 최신 state 의존
        dispatch({ type: "SET_VIEW_MODE", payload: state.previousViewMode || "main" });
    }, [state.previousViewMode]);

    // 환자 선택
    const selectPatient = useCallback((patient: Patient) => {
        dispatch({ type: "SELECT_PATIENT", payload: patient });
    }, []);

    const clearPatientSelection = useCallback(() => {
        dispatch({ type: "CLEAR_PATIENT_SELECTION" });
    }, []);

    // 검색어(서버 검색 훅이 따로 처리하므로 여기서는 상태만 유지)
    const setSearchTerm = useCallback((term: string) => {
        dispatch({ type: "SET_SEARCH_TERM", payload: term });
    }, []);

    // 에러 처리
    const setError = useCallback((error: string | null) => {
        dispatch({ type: "SET_ERROR", payload: error });
    }, []);
    const clearError = useCallback(() => {
        dispatch({ type: "CLEAR_ERROR" });
    }, []);

    // 권한
    const hasPermission = useCallback(
        (permission: string) => state.currentUser?.permissions.includes(permission as any) ?? false,
        [state.currentUser]
    );
    const isDoctor = useCallback(() => state.currentUser?.role === "doctor", [state.currentUser]);
    const isAdmin = useCallback(() => state.currentUser?.role === "admin", [state.currentUser]);

    const contextValue: AppContextType = {
        state,
        login,
        logout,
        navigateTo,
        goBack,
        selectPatient,
        clearPatientSelection,
        setSearchTerm,
        setError,
        clearError,
        hasPermission,
        isDoctor,
        isAdmin,
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// ---- 커스텀 훅 (기존 시그니처 유지) ----
export const useApp = (): AppContextType => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within an AppProvider");
    return ctx;
};

export const useAuth = () => {
    const { state, login, logout } = useApp();
    return {
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        login,
        logout,
    };
};

export const useNavigation = () => {
    const { state, navigateTo, goBack } = useApp();
    return {
        viewMode: state.viewMode,
        previousViewMode: state.previousViewMode,
        navigateTo,
        goBack,
    };
};

export const usePatients = () => {
    const { state, selectPatient, clearPatientSelection, setSearchTerm } = useApp();
    return {
        selectedPatient: state.selectedPatient,
        patients: state.patients,            // 서버 검색 훅을 쓰는 경우 빈 배열일 수 있음
        searchTerm: state.searchTerm,
        filteredPatients: state.filteredPatients, // 서버 검색으로 대체됨
        selectPatient,
        clearPatientSelection,
        setSearchTerm,
    };
};

export const useError = () => {
    const { state, setError, clearError } = useApp();
    return {
        error: state.error,
        isLoading: state.isLoading,
        setError,
        clearError,
    };
};
