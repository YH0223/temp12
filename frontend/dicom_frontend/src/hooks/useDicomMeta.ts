// src/hooks/useDicomData.ts
'use client';

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export interface DicomSeries {
    seriesKey?: number;
    seriesInstanceUid: string;
    modality: string;
    seriesNumber?: number;
    seriesDescription?: string;
    numberOfInstances?: number;
    instances: Array<{
        sopInstanceUid: string;
        seriesInstanceUid: string;
        modality: string;
        fileUrl?: string;
        // 필요시 추가 필드...
    }>;
}

export interface DicomManifest {
    study: {
        studyKey:number;
        patientName?: string;
        studyDescription?: string;
        studyDate?: string;
        modality?: string;
        numberOfSeries?: number;
        numberOfInstances?: number;
        studyInstanceUID?: string;
    };
    series: DicomSeries[];
    // 선택적으로 instances map을 별도로 둘 수도 있지만
    // 현재는 series[].instances 안에 바로 포함된 구조로 가정
}

export function useDicomStudy(studyKey: number) {
    const [manifest, setManifest] = useState<DicomManifest | null>(null);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const fetchManifest = useCallback(async () => {
        if (studyKey == null) return;
        try {
            setLoading(true);
            setError(null);
            setProgress(0);

            const data = await apiClient.getStudyManifest(studyKey, (p) => setProgress(p));
            // 백엔드 응답 스키마를 뷰어가 기대하는 형태로 맞춤 (필요 시 변환)
            // 여기서는 series[].instances[].fileUrl 그대로 사용
            const normalized: DicomManifest = {
                study: {
                    studyKey:data.studyKey,
                    patientName: data.patientName ?? "Anonymous",
                    studyDescription: data.studyDescription ?? "",
                    studyDate: data.studyDate,
                    modality: data.modality, // 전체 스터디의 대표 모달리티가 있으면
                    studyInstanceUID: data.studyInstanceUid,
                },
                series: (data.series ?? []).map((s: any, idx: number) => ({
                    seriesInstanceUid: s.seriesInstanceUid,
                    seriesNumber: s.seriesNumber,
                    numberOfInstances: s.instances?.length ?? 0,
                    instances: s.instances ?? [],
                })),
            };

            setManifest(normalized);
        } catch (e: any) {
            const status = e?.response?.status;
            if (status === 401) {
                setError("인증이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.");
            } else {
                setError(e?.response?.data?.message || e?.message || "로딩 실패");
            }
        } finally {
            setLoading(false);
        }
    }, [studyKey]);

    useEffect(() => {
        if (studyKey != null) fetchManifest();
    }, [studyKey, fetchManifest]);

    const reload = () => fetchManifest();

    return { manifest, isLoading, error, progress, reload };
}

export function useDicomLoadingState() {
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    return { currentFile, setCurrentFile };
}