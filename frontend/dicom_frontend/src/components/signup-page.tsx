"use client"

import type React from "react"
import { User, Lock, Eye, EyeOff, Shield, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react"
import { useSignup } from "../hooks/use-signup"

interface SignupPageProps {
    onSignupSuccess: () => void
    onBackToLogin: () => void
}

export default function SignupPage({ onSignupSuccess, onBackToLogin }: SignupPageProps) {
    const {
        formData,
        handleInputChange,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        isLoading,
        error,
        success,
        handleSignup,
    } = useSignup()

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await handleSignup(onSignupSuccess)
    }

    return (
        <div className="h-screen bg-gray-800 flex flex-col">
            {/* Header - 로그인 페이지와 동일한 스타일 */}
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
            <div className="flex-1 flex items-center justify-center bg-gray-800 p-4">
                <div className="w-full max-w-md">
                    {/* 회원가입 카드 */}
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 shadow-2xl">
                        {/* 헤더 */}
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={onBackToLogin} className="p-2 hover:bg-gray-800 rounded-md transition-colors">
                                <ArrowLeft className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                            </button>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                                        <Shield className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">회원가입</h1>
                                        <p className="text-gray-400 text-sm">의료영상뷰어 시스템 계정을 생성하세요</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 회원가입 폼 */}
                        <form onSubmit={onSubmit} className="space-y-6">
                            {/* 사용자명 */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                    ID <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                        placeholder="사용자명을 입력하세요"
                                        required
                                    />
                                </div>
                            </div>
                            {/* 이름 */}
                            <div>
                                <label htmlFor="id" className="block text-sm font-medium text-gray-300 mb-2">
                                    이름 <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="displayName"
                                        name="displayName"                             // ✅ 필수
                                        type="text"
                                        value={formData.displayName}                  // ✅ 바인딩
                                        onChange={handleInputChange}                  // ✅ 훅 함수 사용
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                        placeholder="표시 이름을 입력하세요"
                                        required
                                    />
                                </div>
                            </div>
                            {/* 비밀번호 */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    비밀번호 <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                        placeholder="비밀번호를 입력하세요 (최소 6자)"
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

                            {/* 비밀번호 확인 */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    비밀번호 확인 <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                        placeholder="비밀번호를 다시 입력하세요"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? (
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

                            {/* 성공 메시지 */}
                            {success && (
                                <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/30 rounded-md">
                                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                                    <span className="text-green-400 text-sm">{success}</span>
                                </div>
                            )}

                            {/* 회원가입 버튼 */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        회원가입 중...
                                    </>
                                ) : (
                                    "회원가입"
                                )}
                            </button>
                        </form>

                        {/* 추가 정보 */}
                        <div className="mt-6 text-center">
                            <div className="flex justify-center gap-4 text-sm">
                                <button onClick={onBackToLogin} className="text-gray-400 hover:text-gray-300 transition-colors">
                                    로그인으로 돌아가기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
