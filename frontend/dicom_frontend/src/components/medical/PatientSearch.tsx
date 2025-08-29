"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PatientCard } from "./PatientCard"
import { Search, Filter, X, Code } from "lucide-react"
import type { ModalityType, Patient, StudySummaryDto } from "@/types/medical.types"
import { useDicomStudySearch } from "@/hooks/useDicomStudySearch"

const modalityOptions: ModalityType[] = ["CT", "MRI", "X-Ray", "US", "PET", "SPECT"]

interface PatientSearchProps {
    onPatientSelect?: (patient: Patient) => void
}

export const PatientSearch: React.FC<PatientSearchProps> = ({ onPatientSelect }) => {
    console.log("[PatientSearch] render")
    useEffect(() => {
        console.log("[PatientSearch] mounted")
    }, [])

    const {
        searchCondition,
        setCondition,
        setModalityCondition,
        searchResults,
        isLoading,
        error,
        currentPage,
        handlePageChange,
        refetch, // ← 이걸 명시적으로 호출해야 실제 요청이 나감
    } = useDicomStudySearch({ debounceTime: 400, initialSize: 5 })

    // UI 상태
    const [localPid, setLocalPid] = useState(searchCondition.pid || "")
    const [localPname, setLocalPname] = useState(searchCondition.pname || "")
    const [localStudyDesc, setLocalStudyDesc] = useState(searchCondition.studyDesc || "")
    const [localAccession, setLocalAccession] = useState(searchCondition.accession || "")
    const [selectedModalities, setSelectedModalities] = useState<ModalityType[]>(
        (searchCondition.modality?.split(",").filter(Boolean) as ModalityType[]) || [],
    )
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [showJsonData, setShowJsonData] = useState(false)

    // 훅에 조건 반영(디바운스는 훅 내부)
    useEffect(() => {
        setCondition("pid", localPid)
    }, [localPid, setCondition])
    useEffect(() => {
        setCondition("pname", localPname)
    }, [localPname, setCondition])
    useEffect(() => {
        setCondition("studyDesc", localStudyDesc)
    }, [localStudyDesc, setCondition])
    useEffect(() => {
        setCondition("accession", localAccession)
    }, [localAccession, setCondition])
    useEffect(() => {
        setModalityCondition(selectedModalities)
    }, [selectedModalities, setModalityCondition])

    // 검색 강제 트리거
    const doSearch = () => {
        console.log("[PatientSearch] refetch()")
        refetch()
    }

    const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            doSearch()
        }
    }

    // Study → Patient 매핑
    const normalizeModality = (m?: string): ModalityType => {
        const key = (m ?? "").toUpperCase()
        const map: Record<string, ModalityType> = {
            CT: "CT",
            MR: "MRI",
            MRI: "MRI",
            CR: "X-Ray",
            DX: "X-Ray",
            XR: "X-Ray",
            "X-RAY": "X-Ray",
            US: "US",
            PT: "PET",
            PET: "PET",
            NM: "SPECT",
            SPECT: "SPECT",
        }
        return map[key] ?? "CT"
    }


    const toNumber = (v: any): number | undefined => {
        if (v == null) return undefined;
        const n = typeof v === 'string' ? Number(v) : v;
        return Number.isFinite(n) ? n : undefined;
    };



// ✔ 매핑 수정
    const createPatientFromStudy = (s: StudySummaryDto): Patient => ({
        studyKey: s.studyKey,
        id: s.studyUid,
        patientName: s.pname ?? 'Anonymous',           // ← PatientCard가 name을 읽습니다
        patientId: s.pid,
        modality: normalizeModality(s.modality),
        studyDescription: s.studyDesc ?? '',
        images: [],
        birthDate: undefined,
        bodyPart: s.bodyPart ?? '',
        studyInstanceUID: s.studyUid,
        seriesInstanceUID: undefined,
    });
    const handlePatientSelect = (study: StudySummaryDto ) => {
        const p = createPatientFromStudy(study);
        console.log('[selectPatient] will pass', {
            studyKey: p.studyKey,
            studyUid: p.studyInstanceUID,
            name: p.patientName,
        });
        onPatientSelect?.(p);
    };

    const toggleModality = (modality: ModalityType) => {
        setSelectedModalities((prev) =>
            prev.includes(modality) ? prev.filter((m) => m !== modality) : [...prev, modality],
        )
    }

    const clearFilters = () => {
        setLocalPid("")
        setLocalPname("")
        setLocalStudyDesc("")
        setLocalAccession("")
        setSelectedModalities([])
    }

    const hasActiveFilters =
        localPid.trim() !== "" ||
        localPname.trim() !== "" ||
        localStudyDesc.trim() !== "" ||
        localAccession.trim() !== "" ||
        selectedModalities.length > 0

    const totalPages = searchResults?.page?.totalPages ?? 0
    const totalElements = searchResults?.page?.totalElements ?? 0

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            환자 및 검사 검색
                        </div>
                        <div className="flex items-center gap-2">
                            {/* 🔎 명시적 검색 버튼 추가 */}
                            <Button onClick={doSearch} disabled={isLoading}>
                                검색
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={isFilterOpen ? "bg-gray-700" : ""}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                필터
                            </Button>

                            {searchResults && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowJsonData(!showJsonData)}
                                    className={showJsonData ? "bg-gray-700" : ""}
                                >
                                    <Code className="h-4 w-4 mr-2" />
                                    JSON
                                </Button>
                            )}

                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-400 hover:text-red-300">
                                    <X className="h-4 w-4 mr-2" />
                                    초기화
                                </Button>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* 메인 검색어 (pid/pname 동시 반영) */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            type="text"
                            placeholder="환자명(pname) 또는 ID(pid)를 입력 후 Enter 또는 '검색' 클릭"
                            value={localPname || localPid}
                            onChange={(e) => {
                                setLocalPname(e.target.value)
                                setLocalPid(e.target.value)
                            }}
                            onKeyDown={handleEnter} // ← Enter로도 검색
                            className="pl-10"
                        />
                    </div>

                    {/* 모달리티 필터 */}
                    {isFilterOpen && (
                        <div className="space-y-3 p-4 bg-gray-800 rounded-lg border border-gray-600">
                            <div className="text-sm font-medium text-gray-300">모달리티로 필터링</div>
                            <div className="flex flex-wrap gap-2">
                                {modalityOptions.map((modality) => (
                                    <Badge
                                        key={modality}
                                        variant={selectedModalities.includes(modality) ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-red-700"
                                        onClick={() => toggleModality(modality)}
                                    >
                                        {modality}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 추가 필터 */}
                    {isFilterOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                type="text"
                                placeholder="Accession Number (accession)"
                                value={localAccession}
                                onChange={(e) => setLocalAccession(e.target.value)}
                                onKeyDown={handleEnter}
                            />
                            <Input
                                type="text"
                                placeholder="검사 설명 (studyDesc)"
                                value={localStudyDesc}
                                onChange={(e) => setLocalStudyDesc(e.target.value)}
                                onKeyDown={handleEnter}
                            />
                        </div>
                    )}

                    {/* 요약 */}
                    {hasActiveFilters && (
                        <div className="text-sm text-gray-400">
                            {totalElements}개의 검색 결과
                            {selectedModalities.length > 0 && ` (${selectedModalities.join(", ")} 모달리티)`}
                        </div>
                    )}
                </CardContent>
            </Card>

            {showJsonData && searchResults && (
                <Card className="bg-gray-900 border-gray-600">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            API 응답 데이터 (JSON)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
            <pre className="text-xs text-gray-300 bg-black p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
              {JSON.stringify(searchResults, null, 2)}
            </pre>
                        <div className="mt-2 text-xs text-gray-500">
                            총 {searchResults.content?.length || 0}개 항목 표시 중 (전체: {totalElements}개)
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 결과 영역 */}
            <div>
                {isLoading && (
                    <div className="text-center py-12 text-gray-400">
                        <Search className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-bounce" />
                        <h3 className="text-lg font-medium">검색 중...</h3>
                        <p>잠시만 기다려 주세요.</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-12">
                        <X className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-red-400 mb-2">오류 발생</h3>
                        <p className="text-red-500">{error}</p>
                    </div>
                )}

                {!isLoading && !error && (
                    <>
                        {(!searchResults || totalElements === 0) && !hasActiveFilters ? (
                            <div className="text-center py-12">
                                <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-400 mb-2">환자 및 검사 검색</h3>
                                <p className="text-gray-500">조건 입력 후 Enter 또는 ‘검색’을 누르세요.</p>
                            </div>
                        ) : (!searchResults || totalElements === 0) && hasActiveFilters ? (
                            <div className="text-center py-12">
                                <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-400 mb-2">검색 결과 없음</h3>
                                <p className="text-gray-500">입력하신 조건에 맞는 스터디가 없습니다.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4">
                                    {searchResults?.content.map((study) => (
                                        <PatientCard
                                            key={study.studyKey}
                                            patient={createPatientFromStudy(study)}
                                            onClick={() => handlePatientSelect(study)}
                                        />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center mt-6 space-x-2">
                                        <Button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 0 || isLoading}
                                            variant="outline"
                                            className="bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50"
                                        >
                                            이전
                                        </Button>
                                        <span className="text-white">
                      {currentPage + 1} / {totalPages}
                    </span>
                                        <Button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= totalPages - 1 || isLoading}
                                            variant="outline"
                                            className="bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50"
                                        >
                                            다음
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
