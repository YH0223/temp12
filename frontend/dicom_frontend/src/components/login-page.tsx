"use client"

import type React from "react"
import { User, Lock, Eye, EyeOff, Shield, AlertCircle } from "lucide-react"
import { useLogin } from "../hooks/use-login"

interface LoginPageProps {
    onLoginSuccess: () => void
    onShowSignup: () => void
}

export default function LoginPage({ onLoginSuccess, onShowSignup }: LoginPageProps) {
    const { username, setUsername, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin } =
        useLogin()

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await handleLogin(onLoginSuccess)
    }

    return (
        <div className="h-screen bg-gray-800 flex flex-col">
            {/* Header - 메인페이지와 동일한 스타일 */}
            <div className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">의</span>
                        </div>
                        <div>
                            <span className="text-white font-bold text-lg">의료영상뷰어</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-gray-300 text-sm">
                    <button className="hover:text-white">도움말</button>
                    <button className="hover:text-white">문의</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center bg-gray-800">
                <div className="w-full max-w-md">
                    {/* 로그인 카드 */}
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 shadow-2xl">
                        {/* 로고 및 제목 */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">로그인</h1>
                            <p className="text-gray-400 text-sm">의료영상뷰어 시스템에 접속하세요</p>
                        </div>

                        {/* 로그인 폼 */}
                        <form onSubmit={onSubmit} className="space-y-6">
                            {/* 사용자명 입력 */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                    사용자명
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                        placeholder="사용자명을 입력하세요"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 비밀번호 입력 */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    비밀번호
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                        placeholder="비밀번호를 입력하세요"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* 에러 메시지 */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                    <span className="text-red-400 text-sm">{error}</span>
                                </div>
                            )}

                            {/* 로그인 버튼 */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        로그인 중...
                                    </>
                                ) : (
                                    "로그인"
                                )}
                            </button>
                        </form>

                        {/* 추가 정보 */}
                        <div className="mt-6 text-center">
                            <div className="flex justify-center gap-4 text-sm">
                                <button className="text-gray-400 hover:text-gray-300 transition-colors">비밀번호 찾기</button>
                                <span className="text-gray-600">|</span>
                                <button onClick={onShowSignup} className="text-gray-400 hover:text-gray-300 transition-colors">
                                    회원가입
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
