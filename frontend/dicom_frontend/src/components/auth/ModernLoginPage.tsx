/**
 * 현대적인 로그인 페이지 (shadcn/ui 사용)
 */

"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
    User, 
    Lock, 
    Eye, 
    EyeOff, 
    Shield,
    AlertCircle,
    Loader2
} from "lucide-react"
import { useAuth, useApp, useError } from "@/contexts/AppContext"
import { APP_CONFIG } from "@/config/app.config"

export default function ModernLoginPage() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()
    const { navigateTo } = useApp()
    const { error, isLoading, setError, clearError } = useError()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()

        if (!username.trim() || !password.trim()) {
            setError("사용자명과 비밀번호를 모두 입력해주세요.")
            return
        }

        try {
            const success = await login(username, password)
            if (!success) {
                setError("로그인에 실패했습니다. 정보를 확인해주세요.")
            }
        } catch (error) {
            setError("로그인 중 오류가 발생했습니다.")
        }
    }

    const handleShowSignup = () => {
        navigateTo('signup')
    }

    // 데모 계정 정보
    const demoAccounts = [
        { username: "admin", password: "admin", role: "관리자" },
        { username: "doctor", password: "doctor", role: "의사" },
        { username: "tech", password: "tech", role: "기사" },
    ]

    const setDemoAccount = (account: { username: string; password: string }) => {
        setUsername(account.username)
        setPassword(account.password)
        clearError()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
            {/* 헤더 */}
            <div className="w-full p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{APP_CONFIG.shortName}</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">{APP_CONFIG.name}</h1>
                        <p className="text-gray-400 text-sm">의료 전문가를 위한 DICOM 뷰어</p>
                    </div>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-6">
                    {/* 로그인 카드 */}
                    <Card className="border-gray-600 shadow-2xl">
                        <CardHeader className="text-center space-y-2">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl">로그인</CardTitle>
                            <CardDescription>
                                의료영상뷰어에 접속하려면 로그인하세요
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* 에러 메시지 */}
                            {error && (
                                <div className="flex items-center space-x-2 p-3 bg-red-900/50 border border-red-700 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                    <span className="text-red-400 text-sm">{error}</span>
                                </div>
                            )}

                            {/* 로그인 폼 */}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-sm font-medium text-gray-300">
                                        사용자명
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="사용자명을 입력하세요"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium text-gray-300">
                                        비밀번호
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="비밀번호를 입력하세요"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-1 top-1 h-8 w-8 p-0 text-gray-500 hover:text-gray-400"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            로그인 중...
                                        </>
                                    ) : (
                                        "로그인"
                                    )}
                                </Button>
                            </form>

                            <Separator />

                            {/* 회원가입 링크 */}
                            <div className="text-center">
                                <Button 
                                    variant="ghost" 
                                    onClick={handleShowSignup}
                                    disabled={isLoading}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    계정이 없으신가요? 회원가입하기
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 데모 계정 카드 */}
                    <Card className="border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg">데모 계정</CardTitle>
                            <CardDescription>
                                테스트를 위한 계정들입니다
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-2">
                                {demoAccounts.map((account, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        onClick={() => setDemoAccount(account)}
                                        className="justify-between"
                                        disabled={isLoading}
                                    >
                                        <span>{account.username}</span>
                                        <Badge variant="secondary">{account.role}</Badge>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 푸터 */}
            <div className="w-full p-6 text-center">
                <p className="text-gray-500 text-sm">
                    © 2024 {APP_CONFIG.name}. 모든 권리 보유.
                </p>
                <p className="text-gray-600 text-xs mt-1">
                    Version {APP_CONFIG.version}
                </p>
            </div>
        </div>
    )
}
