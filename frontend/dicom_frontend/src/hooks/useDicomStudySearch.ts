// src/hooks/useDicomStudySearch.ts
"use client"
console.debug("[HookModule] useDicomStudySearch module loaded")
import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api"
import type { PagedResponse, StudySummaryDto, ModalityType } from "@/types/medical.types"

interface StudySearchCondition {
    pid?: string
    pname?: string
    accession?: string
    studyDesc?: string
    modality?: string // "CT,MRI"
    bodyPart?: string
    fromDate?: string
    toDate?: string
}

interface DicomSearchOptions {
    initialCondition?: StudySearchCondition
    initialPage?: number
    initialSize?: number
    debounceTime?: number
}

export const useDicomStudySearch = (options?: DicomSearchOptions) => {
    console.debug("[Hook] useDicomStudySearch CALLED")
    const { initialCondition = {}, initialPage = 0, initialSize = 20, debounceTime = 400 } = options || {}

    const [searchCondition, setSearchCondition] = useState<StudySearchCondition>(initialCondition)
    const [currentPage, setCurrentPage] = useState<number>(initialPage)
    const [pageSize, setPageSize] = useState<number>(initialSize)
    const [searchResults, setSearchResults] = useState<PagedResponse<StudySummaryDto> | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [triggerSearch, setTriggerSearch] = useState<number>(0) // 수동 트리거 카운터

    // ✅ 타입-세이프하게 변경
    const hasValidSearchCondition = useCallback((condition: StudySearchCondition) => {
        const ok = Object.values(condition).some((v) => typeof v === "string" && v.trim() !== "")
        console.debug("[Hook] hasValidSearchCondition =", ok, "condition =", condition)
        return ok
    }, [])

    // ✅ force 플래그 추가로 refetch 시 가드 우회
    const fetchSearchResults = useCallback(
        async (condition: StudySearchCondition, page: number, size: number) => {
            console.debug("[Hook] fetchSearchResults called", { condition, page, size })

            if (!hasValidSearchCondition(condition)) {
                console.debug("[Hook] guard: empty condition → skip request")
                setSearchResults(null)
                return
            }

            setIsLoading(true)
            setError(null)
            try {
                const data = await apiClient.searchDicomStudies(condition, page, size)
                console.debug("[Hook] data received", data)
                setSearchResults(data)
            } catch (err) {
                console.error("[Hook] fetch error", err)
                setError("DICOM 스터디 검색 결과를 불러오는 데 실패했습니다.")
            } finally {
                setIsLoading(false)
            }
        },
        [hasValidSearchCondition],
    )

    useEffect(() => {
        console.debug("[Hook] effect fired", {
            searchCondition,
            currentPage,
            pageSize,
            triggerSearch,
        })

        const handler = setTimeout(() => {
            if (triggerSearch === 0 && !hasValidSearchCondition(searchCondition)) {
                console.debug("[Hook] effect guard: no trigger & empty condition → skip")
                setSearchResults(null)
                return
            }
            fetchSearchResults(searchCondition, currentPage, pageSize)
        }, debounceTime)

        return () => {
            clearTimeout(handler)
        }
    }, [searchCondition, currentPage, pageSize, debounceTime, fetchSearchResults, hasValidSearchCondition, triggerSearch])

    const setCondition = useCallback((key: keyof StudySearchCondition, value: string | undefined) => {
        setSearchCondition((prev) => {
            const next = { ...prev, [key]: value ? value : undefined }
            setCurrentPage(0)
            return next
        })
    }, [])

    const setModalityCondition = useCallback(
        (modalities: ModalityType[]) => {
            setCondition("modality", modalities.length > 0 ? modalities.join(",") : undefined)
        },
        [setCondition],
    )

    const handlePageChange = useCallback((newPage: number) => {
        setCurrentPage(newPage)
    }, [])

    const refetch = useCallback(() => {
        console.debug("[Hook] refetch CALLED")
        setTriggerSearch((prev) => prev + 1)
        setCurrentPage(0)
    }, [])

    return {
        searchCondition,
        setCondition,
        setModalityCondition,
        searchResults,
        isLoading,
        error,
        currentPage,
        pageSize,
        handlePageChange,
        totalPages: searchResults?.totalPages || 0,
        totalElements: searchResults?.totalElements || 0,
        refetch,
    }
}
