"use client"

import type React from "react"
import { useMemo } from "react"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Users, FileImage, Activity, Calendar, Clock } from "lucide-react"
import { useApp, useAuth } from "@/contexts/AppContext"
import { useDicomStudySearch } from "@/hooks/useDicomStudySearch"

// 날짜 유틸
const fmt = (n: number) => String(n).padStart(2, "0")
const todayYYYYMMDD = () => {
    const d = new Date()
    return `${d.getFullYear()}${fmt(d.getMonth() + 1)}${fmt(d.getDate())}`
}
const daysAgoYYYYMMDD = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return `${d.getFullYear()}${fmt(d.getMonth() + 1)}${fmt(d.getDate())}`
}
const toRelative = (yyyymmdd?: string, hhmmss?: string) => {
    if (!yyyymmdd) return ""
    try {
        const y = Number(yyyymmdd.slice(0, 4))
        const m = Number(yyyymmdd.slice(4, 6)) - 1
        const d = Number(yyyymmdd.slice(6, 8))
        const hh = Number((hhmmss ?? "").slice(0, 2) || "12")
        const mm = Number((hhmmss ?? "").slice(2, 4) || "00")
        const ss = Number((hhmmss ?? "").slice(4, 6) || "00")
        const t = new Date(y, m, d, hh, mm, ss).getTime()
        if (Number.isNaN(t)) return yyyymmdd
        const diff = Date.now() - t
        const abs = Math.abs(diff)
        const min = Math.floor(abs / 60000)
        const hr = Math.floor(abs / 3600000)
        const day = Math.floor(abs / 86400000)
        if (min < 1) return diff < 0 ? "곧 시작" : "방금 전"
        if (min < 60) return diff < 0 ? `${min}분 후` : `${min}분 전`
        if (hr < 24) return diff < 0 ? `${hr}시간 후` : `${hr}시간 전`
        return diff < 0 ? `${day}일 후` : `${day}일 전`
    } catch {
        return yyyymmdd
    }
}

export const MainDashboard: React.FC = () => {
    const { navigateTo } = useApp()
    const { currentUser } = useAuth()

    // ---- 훅으로 데이터 가져오기 (훅은 수정하지 않음) ----
    const today = todayYYYYMMDD()
    const last7 = daysAgoYYYYMMDD(7)

    // 오늘 검사 수(총 건수만 필요하므로 size=1)
    const {
        searchResults: todayRes,
        isLoading: todayLoading,
        error: todayError,
    } = useDicomStudySearch({
        initialCondition: { fromDate: today, toDate: today },
        initialPage: 0,
        initialSize: 1,
        debounceTime: 0,
    })

    // 최근 활동(최근 7일, 최신 10건)
    const {
        searchResults: recentRes,
        isLoading: recentLoading,
        error: recentError,
    } = useDicomStudySearch({
        initialCondition: { fromDate: last7, toDate: today },
        initialPage: 0,
        initialSize: 10,
        debounceTime: 0,
    })

    const todayCount = useMemo(() => todayRes?.totalElements ?? 0, [todayRes?.totalElements])

    // 표시용 안전 이름
    const userName =
        (currentUser as any)?.name ?? (currentUser as any)?.displayName ?? (currentUser as any)?.username ?? "사용자"

    // 퀵 액션
    const quickActions = [
        {
            title: "환자 검색",
            description: "환자 정보 및 영상 검색",
            icon: Users,
            action: () => navigateTo("search"),
        },
        {
            title: "새 스터디",
            description: "새로운 검사 등록",
            icon: FileImage,
            action: () => console.log("새 스터디"),
        },
        {
            title: "시스템 모니터링",
            description: "시스템 상태 확인",
            icon: Activity,
            action: () => console.log("모니터링"),
        },
    ]

    return (
        <div className="h-screen bg-gray-800 flex flex-col">
            <Header currentView="main" />

            <div className="flex-1 flex">
                <Sidebar currentView="main" />

                {/* 메인 컨텐츠 영역 */}
                <main className="flex-1 p-6 overflow-auto">
                    {/* 환영 메시지 */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-100 mb-2">안녕하세요, {userName}님! 👋</h1>
                        <p className="text-gray-400">의료영상뷰어 대시보드에 오신 것을 환영합니다.</p>
                    </div>

                    {/* 통계 카드들 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* 총 환자 수: API 연동 전까지 보류(표시만 깔끔히) */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">총 환자 수</CardTitle>
                                <Users className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-100">—</div>
                                <p className="text-xs text-gray-500 mt-1">API 연동 필요</p>
                            </CardContent>
                        </Card>

                        {/* 오늘 검사: 훅 데이터 사용 */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">오늘 검사</CardTitle>
                                <Calendar className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-100">{todayLoading ? "…" : todayCount}</div>
                                <p className="text-xs mt-1">
                                    {todayError ? (
                                        <span className="text-red-400">불러오기 실패</span>
                                    ) : (
                                        <span className="text-blue-400">금일 기준</span>
                                    )}
                                </p>
                            </CardContent>
                        </Card>

                        {/* 활성 뷰어: 보류 */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">활성 뷰어</CardTitle>
                                <Monitor className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-100">—</div>
                                <p className="text-xs text-gray-500 mt-1">API 연동 필요</p>
                            </CardContent>
                        </Card>

                        {/* 시스템 가동률: 보류 */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">시스템 가동률</CardTitle>
                                <Activity className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-100">—</div>
                                <p className="text-xs text-gray-500 mt-1">API 연동 필요</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 메인 컨텐츠 그리드 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 빠른 실행 */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>빠른 실행</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {quickActions.map((action, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-gray-700 bg-transparent"
                                            onClick={action.action}
                                        >
                                            <action.icon className="h-8 w-8" />
                                            <div className="text-center">
                                                <div className="font-medium">{action.title}</div>
                                                <div className="text-xs text-gray-400">{action.description}</div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 최근 활동: 최근 7일 내 스터디 10건 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>최근 활동</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentError && <div className="text-sm text-red-400 mb-3">최근 활동을 불러오지 못했습니다.</div>}

                                {recentLoading && !recentRes?.content?.length && (
                                    <div className="text-gray-400 text-sm">불러오는 중…</div>
                                )}

                                {!recentLoading && (!recentRes?.content || recentRes.content.length === 0) && (
                                    <div className="text-gray-500 text-sm">최근 항목이 없습니다.</div>
                                )}

                                <div className="space-y-4">
                                    {recentRes?.content?.map((s) => (
                                        <div key={s.studyKey} className="flex items-start space-x-3 text-sm">
                                            <div className="flex-shrink-0">
                                                <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-gray-200">
                                                        환자명 - {s.pname}
                                                        {s.accessionNum ? <span className="text-gray-500"> · {s.accessionNum}</span> : null}
                                                    </p>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {s.modality}
                                                    </Badge>
                                                </div>
                                                <p className="text-gray-500 text-xs">
                                                    {toRelative(s.studyDate, s.studyTime)} ·{" "}
                                                    {s.studyDesc && s.studyDesc.trim().length > 0 ? s.studyDesc : "설명 없음"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 시작하기 버튼 */}
                    <div className="mt-8 text-center">
                        <Button size="lg" onClick={() => navigateTo("search")} className="px-8">
                            <Monitor className="h-5 w-5 mr-2" />
                            환자 검색 시작하기
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    )
}
