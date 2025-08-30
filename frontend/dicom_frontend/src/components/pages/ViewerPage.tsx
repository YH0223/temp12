// src/components/viewer/ViewerPage.tsx
'use client';

import React, { useEffect, useState } from "react";
import { useNavigation } from "@/contexts/AppContext";
import {setupCornerstone} from "@/lib/cornerstone/setup";
import { useDicomStudy, useDicomLoadingState } from "@/hooks/useDicomData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ZoomIn, ZoomOut, RotateCw, Eye } from "lucide-react";
import { CornerstoneViewport } from "@/components/viewer/CornerstoneViewport";
import { usePrefetchCornerstone } from "@/hooks/usePreFetchCornerStone";

interface ViewerPageProps {
    studyKey: number;
}

export function ViewerPage({ studyKey }: ViewerPageProps) {
    console.log("[ViewerPage] studyKey:", studyKey);
    useEffect(() => {
        setupCornerstone();
    }, []);



    const { navigateTo } = useNavigation();
    const { manifest, isLoading, error, progress, reload } = useDicomStudy(studyKey);
    const loadingState = useDicomLoadingState();

    const [selectedSeriesIndex, setSelectedSeriesIndex] = useState<number | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [viewerSettings, setViewerSettings] = useState({
        zoom: 1,
        windowCenter: 40,
        windowWidth: 400,
        invert: false,
        annotations: true,
    });

    // Study 로드 시 첫 시리즈 선택
    useEffect(() => {
        if (manifest && manifest.series.length > 0 && selectedSeriesIndex == null) {
            setSelectedSeriesIndex(0);
            setCurrentImageIndex(0);
        }
    }, [manifest, selectedSeriesIndex]);

    // 선택된 시리즈
    const selectedSeries =
        selectedSeriesIndex != null ? manifest?.series[selectedSeriesIndex] ?? null : null;

    // 현재 시리즈의 imageIds 구성 (wadouri:fileUrl)
    const imageIds = (selectedSeries?.instances ?? [])
        .map((inst) => inst.fileUrl)
        .filter((u): u is string => !!u)
        .map((u) => `wadouri:${u}`);

    // 인접 슬라이스 프리페치
    usePrefetchCornerstone(imageIds, currentImageIndex);

    const handleSeriesSelect = (idx: number) => {
        setSelectedSeriesIndex(idx);
        setCurrentImageIndex(0);
    };

    const handleImageNavigation = (dir: "prev" | "next") => {
        if (!imageIds.length) return;
        if (dir === "prev") {
            setCurrentImageIndex((v) => Math.max(0, v - 1));
        } else {
            setCurrentImageIndex((v) => Math.min(imageIds.length - 1, v + 1));
        }
    };

    const handleZoom = (dir: "in" | "out") => {
        setViewerSettings((prev) => ({
            ...prev,
            zoom: dir === "in" ? Math.min(prev.zoom * 1.2, 5) : Math.max(prev.zoom / 1.2, 0.1),
        }));
    };

    if (studyKey == null) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-300 mb-4">DICOM 뷰어</h2>
                    <p className="text-gray-500 mb-6">Study가 선택되지 않았습니다.</p>
                    <Button onClick={() => navigateTo("search")} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        검색으로 돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-300 mb-4">DICOM 로딩 중...</h2>
                    <div className="w-64 bg-gray-700 rounded-full h-2 mb-4">
                        <div
                            className="bg-red-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-gray-500">{progress.toFixed(0)}% 완료</p>
                    {loadingState.currentFile && (
                        <p className="text-sm text-gray-600 mt-2">로딩 중: {loadingState.currentFile}</p>
                    )}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">로딩 오류</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <div className="space-x-4">
                        <Button onClick={reload} variant="outline">
                            다시 시도
                        </Button>
                        <Button onClick={() => navigateTo("search")} variant="ghost">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            돌아가기
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!manifest) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-300 mb-4">데이터 없음</h2>
                    <p className="text-gray-500">DICOM 데이터를 찾을 수 없습니다.</p>
                </div>
            </div>
        );
    }

    const currentImageId = imageIds[currentImageIndex] ?? null;

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            {/* 헤더 */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button onClick={() => navigateTo("search")} variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            돌아가기
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-lg font-semibold text-gray-100">
                                {manifest.study.patientName}
                            </h1>
                            <p className="text-sm text-gray-400">
                                {manifest.study.studyDescription} • {manifest.study.studyDate}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {manifest.study.modality && <Badge variant="outline">{manifest.study.modality}</Badge>}
                        <Badge variant="secondary">{manifest.study.numberOfSeries} Series</Badge>
                        <Badge variant="secondary">{manifest.study.numberOfInstances} Images</Badge>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* 사이드바 - Series 목록 */}
                <div className="w-80 bg-gray-850 border-r border-gray-700 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-md font-semibold text-gray-200 mb-4">Series 목록</h3>
                        <div className="space-y-2">
                            {manifest.series.map((series, idx) => (
                                <Card
                                    key={series.seriesInstanceUID}
                                    className={`cursor-pointer transition-all ${
                                        selectedSeriesIndex === idx
                                            ? "border-red-500 bg-red-900/20"
                                            : "border-gray-600 hover:border-gray-500"
                                    }`}
                                    onClick={() => handleSeriesSelect(idx)}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-200">
                                            Series {series.seriesNumber ?? idx + 1}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-gray-400 mb-2">
                                            {series.seriesDescription ?? "(no description)"}
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <Badge variant="outline" className="text-xs">
                                                {series.modality}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                        {series.numberOfInstances ?? series.instances.length} images
                      </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 메인 뷰어 영역 */}
                <div className="flex-1 flex flex-col">
                    {/* 뷰어 툴바 */}
                    <div className="bg-gray-800 border-b border-gray-700 p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleZoom("out")}>
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-gray-400 min-w-16 text-center">
                  {(viewerSettings.zoom * 100).toFixed(0)}%
                </span>
                                <Button variant="outline" size="sm" onClick={() => handleZoom("in")}>
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                                <Separator orientation="vertical" className="h-6" />
                                <Button variant="outline" size="sm">
                                    <RotateCw className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewerSettings.invert ? "default" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                        setViewerSettings((prev) => ({ ...prev, invert: !prev.invert }))
                                    }
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </div>

                            {selectedSeries && currentImageId && (
                                <div className="flex items-center space-x-4">
                                    <div className="text-sm text-gray-400">
                                        이미지 {currentImageIndex + 1} / {imageIds.length}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentImageIndex === 0}
                                            onClick={() => handleImageNavigation("prev")}
                                        >
                                            이전
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentImageIndex >= imageIds.length - 1}
                                            onClick={() => handleImageNavigation("next")}
                                        >
                                            다음
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 이미지 표시 영역 */}
                    <div className="flex-1 bg-black relative overflow-hidden">
                        {currentImageId ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div
                                    className="bg-gray-800 border border-gray-600 rounded"
                                >
                                    {/* Cornerstone 뷰포트 */}
                                    <CornerstoneViewport imageIds={[currentImageId]} />
                                </div>

                                {/* 오버레이 */}
                                {viewerSettings.annotations && (
                                    <>
                                        <div className="w-full h-full">
                                            {/* CSS transform 제거, 뷰포트 prop으로 전달 */}
                                            <CornerstoneViewport
                                                imageIds={[currentImageId]}
                                                zoom={viewerSettings.zoom}      // 1.0 ~
                                                invert={viewerSettings.invert}  // true/false
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                Series를 선택해주세요
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
