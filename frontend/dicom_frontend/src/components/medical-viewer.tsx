"use client"

import { useState, useEffect, useRef } from "react"
import {
    Search,
    ZoomIn,
    ZoomOut,
    RotateCw,
    RotateCcw,
    Move,
    Contrast,
    Sun,
    Settings,
    Monitor,
    FolderOpen,
    Database,
    Activity,
    Ruler,
    Grid3X3,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import LoginPage from "./login-page"
import SignupPage from "./signup-page"

// cornerstone을 전역 변수로 선언 (동적 import로 초기화)
let cornerstone: any = null;

interface Patient {
    id: string
    name: string
    age: number
    gender: string
    studyDate: string
    modality: string
    studyDescription: string
    images: string[] // DICOM 이미지 경로
}

const mockPatients: Patient[] = [
    {
        id: "P001",
        name: "김철수",
        age: 45,
        gender: "M",
        studyDate: "2024-01-15",
        modality: "CT",
        studyDescription: "Chest CT",
        images: [
            "wadouri:/dicom/chest-ct-001.dcm",
            "wadouri:/dicom/chest-ct-002.dcm",
            "wadouri:/dicom/chest-ct-003.dcm",
            "wadouri:/dicom/chest-ct-004.dcm",
            "wadouri:/dicom/chest-ct-005.dcm",
        ],
    },
    {
        id: "P002",
        name: "이영희",
        age: 32,
        gender: "F",
        studyDate: "2024-01-14",
        modality: "MRI",
        studyDescription: "Brain MRI",
        images: [
            "wadouri:/dicom/brain-mri-001.dcm",
            "wadouri:/dicom/brain-mri-002.dcm",
            "wadouri:/dicom/brain-mri-003.dcm",
        ],
    },
    {
        id: "P003",
        name: "박민수",
        age: 58,
        gender: "M",
        studyDate: "2024-01-13",
        modality: "X-Ray",
        studyDescription: "Chest X-Ray",
        images: [
            "wadouri:/dicom/chest-xray-001.dcm",
            "wadouri:/dicom/chest-xray-002.dcm",
        ],
    },
]

type ViewMode = "login" | "signup" | "main" | "search" | "viewer"

export default function MedicalViewer() {
    const [viewMode, setViewMode] = useState<ViewMode>("login") // 로그인부터 시작
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [thumbnailScrollIndex, setThumbnailScrollIndex] = useState(0)
    const [searchTerm, setSearchTerm] = useState("")
    const [zoomLevel, setZoomLevel] = useState(100)
    const [brightness, setBrightness] = useState(100)
    const [contrast, setContrast] = useState(100)
    const [rotation, setRotation] = useState(0)
    const [measureMode, setMeasureMode] = useState(false)

    const viewerRef = useRef<HTMLDivElement>(null)

    // 로그인 성공 시 메인 화면으로 이동
    const handleLoginSuccess = () => {
        setViewMode("main")
    }

    // 회원가입 페이지로 이동
    const handleShowSignup = () => {
        setViewMode("signup")
    }

    // 회원가입 성공 시 로그인 페이지로 이동
    const handleSignupSuccess = () => {
        setViewMode("login")
    }

    // 로그인 페이지로 돌아가기
    const handleBackToLogin = () => {
        setViewMode("login")
    }

    // 로그아웃 기능
    const handleLogout = () => {
        setViewMode("login")
        setSelectedPatient(null)
        setSearchTerm("")
    }

    useEffect(() => {
        async function initCornerstone() {
            // cornerstone이 아직 로드되지 않았다면 동적으로 import
            if (!cornerstone) {
                cornerstone = await import("cornerstone-core");
            }
            const cornerstoneTools = await import("cornerstone-tools");
            const cornerstoneWADOImageLoader = await import("cornerstone-wado-image-loader");
            
            if (!viewerRef.current) return;
            const element = viewerRef.current;

            // cornerstone 초기화
            cornerstone.enable(element);

            // WADO 이미지 로더 설정
            cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
            cornerstoneWADOImageLoader.external.dicomParser = await import("dicom-parser");
            
            // WADO URI 로더 등록
            cornerstone.registerImageLoader('wadouri', cornerstoneWADOImageLoader.wadouri.loadImage);
            
            // WADO Web Services 로더 등록
            cornerstone.registerImageLoader('wadors', cornerstoneWADOImageLoader.wadors.loadImage);
            
            // DICOM P10 로더 등록
            cornerstone.registerImageLoader('dicomfile', cornerstoneWADOImageLoader.wadouri.loadImage);

            const imageId = selectedPatient?.images[selectedImageIndex];
            if (!imageId) return;

            try {
                const image = await cornerstone.loadAndCacheImage(imageId);
                cornerstone.displayImage(element, image);
                
                // 도구 초기화
                cornerstoneTools.init();
                cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
                cornerstoneTools.addTool(cornerstoneTools.PanTool);
                cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
                cornerstoneTools.addTool(cornerstoneTools.RotateTool);
                cornerstoneTools.addTool(cornerstoneTools.LengthTool);
                
                // 도구 활성화
                cornerstoneTools.setToolActive("Zoom", { mouseButtonMask: 1 });
                cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 2 });
                cornerstoneTools.setToolActive("WindowLevel", { mouseButtonMask: 4 });
                cornerstoneTools.setToolActive("Rotate", { mouseButtonMask: 8 });
                
            } catch (error) {
                console.error('DICOM 이미지 로딩 오류:', error);
            }
        }

        if (viewMode === "viewer" && selectedPatient) {
            initCornerstone();
        }
    }, [viewMode, selectedPatient, selectedImageIndex]);

    const rotateLeft = async () => {
        setRotation((prev) => prev - 90);
        if (viewerRef.current) {
            if (!cornerstone) {
                cornerstone = await import("cornerstone-core");
            }
            const viewport = cornerstone.getViewport(viewerRef.current);
            if (viewport) {
                viewport.rotation -= 90;
                cornerstone.setViewport(viewerRef.current, viewport);
            }
        }
    }

    const rotateRight = async () => {
        setRotation((prev) => prev + 90)
        if (viewerRef.current) {
            if (!cornerstone) {
                cornerstone = await import("cornerstone-core");
            }
            const viewport = cornerstone.getViewport(viewerRef.current);
            if (viewport) {
                viewport.rotation += 90;
                cornerstone.setViewport(viewerRef.current, viewport);
            }
        }
    }

    const filteredPatients =
        searchTerm.trim() === ""
            ? []
            : mockPatients.filter(
                (patient) =>
                    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    patient.id.toLowerCase().includes(searchTerm.toLowerCase()),
            )

    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatient(patient)
        setSelectedImageIndex(0)
        setThumbnailScrollIndex(0)
        setViewMode("viewer")
    }

    const scrollThumbnailsLeft = () => {
        setThumbnailScrollIndex((prev) => Math.max(0, prev - 1))
    }

    const scrollThumbnailsRight = () => {
        if (selectedPatient) {
            const maxScroll = Math.max(0, selectedPatient.images.length - 4)
            setThumbnailScrollIndex((prev) => Math.min(maxScroll, prev + 1))
        }
    }

    const handleThumbnailClick = (index: number) => {
        setSelectedImageIndex(index)
    }

    // 로그인 페이지 렌더링
    if (viewMode === "login") {
        return <LoginPage onLoginSuccess={handleLoginSuccess} onShowSignup={handleShowSignup} />
    }

    // 회원가입 페이지 렌더링
    if (viewMode === "signup") {
        return <SignupPage onSignupSuccess={handleSignupSuccess} onBackToLogin={handleBackToLogin} />
    }

    if (viewMode === "main") {
        return (
            <div className="h-screen bg-gray-800 flex flex-col">
                {/* Header */}
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
                        <button className="hover:text-white">홈</button>
                        <button className="hover:text-white">환자 검색</button>
                        <button className="hover:text-white">판독</button>
                        <button className="hover:text-white">리포트</button>
                        <button className="hover:text-white">통계</button>
                        <button className="hover:text-white">설정</button>
                        <button className="hover:text-white">도움말</button>
                        <button 
                            onClick={handleLogout}
                            className="hover:text-white text-red-400 hover:text-red-300"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex">
                    {/* Left Sidebar */}
                    <div className="w-64 bg-gray-900 border-r border-gray-700">
                        <div className="p-4">
                            <div className="space-y-2">
                                <button
                                    onClick={() => setViewMode("search")}
                                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2"
                                >
                                    <Search className="h-4 w-4" />
                                    환자 검색
                                </button>
                                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4" />
                                    영상 보기
                                </button>
                                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    데이터베이스
                                </button>
                                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    모니터링
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 bg-gray-800 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Monitor className="h-12 w-12 text-gray-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-300 mb-2">의료영상뷰어</h2>
                            <p className="text-gray-500 mb-6">의료 영상 관리 시스템</p>
                            <button
                                onClick={() => setViewMode("search")}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors"
                            >
                                시작하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (viewMode === "search") {
        return (
            <div className="h-screen bg-gray-800 flex flex-col">
                {/* Header */}
                <div className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode("main")}
                            className="flex items-center gap-2 text-gray-300 hover:text-white"
                        >
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">의</span>
                            </div>
                            <div>
                                <span className="text-white font-bold text-lg">의료영상뷰어</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-6 text-gray-300 text-sm">
                        <button onClick={() => setViewMode("main")} className="hover:text-white">
                            홈
                        </button>
                        <button className="text-white border-b border-red-500">환자 검색</button>
                        <button className="hover:text-white">판독</button>
                        <button className="hover:text-white">리포트</button>
                        <button className="hover:text-white">통계</button>
                        <button className="hover:text-white">설정</button>
                        <button className="hover:text-white">도움말</button>
                        <button 
                            onClick={handleLogout}
                            className="hover:text-white text-red-400 hover:text-red-300"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>

                {/* Search Content */}
                <div className="flex-1 flex">
                    {/* Left Sidebar */}
                    <div className="w-64 bg-gray-900 border-r border-gray-700">
                        <div className="p-4">
                            <div className="space-y-2">
                                <button className="w-full text-left px-3 py-2 text-white bg-gray-800 rounded flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    환자 검색
                                </button>
                                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4" />
                                    영상 보기
                                </button>
                                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    데이터베이스
                                </button>
                                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    모니터링
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search Area */}
                    <div className="flex-1 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-200 mb-4">환자 검색</h2>
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="환자명 또는 ID를 입력하세요..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Patient List */}
                        <div className="space-y-3">
                            {searchTerm.trim() !== "" &&
                                filteredPatients.map((patient) => (
                                    <div
                                        key={patient.id}
                                        className="p-4 bg-gray-700 border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors rounded-lg"
                                        onClick={() => handlePatientSelect(patient)}
                                    >
                                        {/* 첫 번째 줄: 이름 */}
                                        <div className="text-gray-200 font-semibold text-lg mb-2">{patient.name}</div>
                                        {/* 두 번째 줄: 나이, 성별, ID, 일정, 사진부위 */}
                                        <div className="text-gray-400 text-sm">
                                            {patient.age}세 • {patient.gender === "M" ? "남성" : "여성"} • ID: {patient.id} •{" "}
                                            {patient.studyDate} • {patient.modality} - {patient.studyDescription}
                                        </div>
                                    </div>
                                ))}
                            {/* 검색어가 없을 때 안내 메시지 */}
                            {searchTerm.trim() === "" && (
                                <div className="text-center text-gray-500 mt-8">환자명 또는 ID를 입력하여 검색하세요.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-800">
            {/* Main Content - 사이드바 없이 전체 화면 사용 */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode("search")}
                            className="flex items-center gap-2 text-gray-300 hover:text-white"
                        >
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">의</span>
                            </div>
                            <div>
                                <span className="text-white font-bold text-lg">의료영상뷰어</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-6 text-gray-300 text-sm">
                        <button onClick={() => setViewMode("main")} className="hover:text-white">
                            홈
                        </button>
                        <button onClick={() => setViewMode("search")} className="hover:text-white">
                            환자 검색
                        </button>
                        <button className="hover:text-white">판독</button>
                        <button className="hover:text-white">리포트</button>
                        <button className="hover:text-white">통계</button>
                        <button className="hover:text-white">설정</button>
                        <button className="hover:text-white">도움말</button>
                        <button 
                            onClick={handleLogout}
                            className="hover:text-white text-red-400 hover:text-red-300"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>

                {selectedPatient && selectedPatient.images.length > 1 && (
                    <div className="h-24 bg-gray-700 border-b border-gray-600 flex items-center px-4">
                        {/* 왼쪽 스크롤 버튼 */}
                        <button
                            onClick={scrollThumbnailsLeft}
                            disabled={thumbnailScrollIndex === 0}
                            className="p-2 bg-gray-600 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        {/* 썸네일 컨테이너 */}
                        <div className="flex-1 overflow-hidden">
                            <div
                                className="flex gap-2 transition-transform duration-300"
                                style={{
                                    transform: `translateX(-${thumbnailScrollIndex * 80}px)`,
                                }}
                            >
                                {selectedPatient.images.map((imagePath, index) => (
                                    <div
                                        key={index}
                                        className={`flex-shrink-0 w-16 h-16 bg-gray-800 border-2 rounded cursor-pointer transition-all ${
                                            selectedImageIndex === index ? "border-red-500" : "border-gray-600 hover:border-gray-500"
                                        }`}
                                        onClick={() => handleThumbnailClick(index)}
                                    >
                                        <div className="w-full h-full bg-gray-600 rounded flex items-center justify-center text-xs text-gray-400">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 오른쪽 스크롤 버튼 */}
                        <button
                            onClick={scrollThumbnailsRight}
                            disabled={!selectedPatient || thumbnailScrollIndex >= Math.max(0, selectedPatient.images.length - 4)}
                            className="p-2 bg-gray-600 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Toolbar */}
                <div className="h-16 bg-gray-700 border-b border-gray-600 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-gray-600 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors">
                            <ZoomIn className="h-4 w-4" />
                        </button>
                        <button className="px-3 py-1.5 bg-gray-600 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors">
                            <ZoomOut className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-gray-300 mx-2">{zoomLevel}%</span>
                        <button
                            className="px-3 py-1.5 bg-gray-600 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors"
                            onClick={rotateLeft}
                            title="왼쪽으로 90도 회전"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                            className="px-3 py-1.5 bg-gray-600 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors"
                            onClick={rotateRight}
                            title="오른쪽으로 90도 회전"
                        >
                            <RotateCw className="h-4 w-4" />
                        </button>
                        <button className="px-3 py-1.5 bg-gray-600 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors">
                            <Move className="h-4 w-4" />
                        </button>
                        <button
                            className={`px-3 py-1.5 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors ${measureMode ? "bg-blue-600" : "bg-gray-600"}`}
                            onClick={() => setMeasureMode(!measureMode)}
                            title="측정 도구 (길이 측정)"
                        >
                            <Ruler className="h-4 w-4" />
                        </button>
                        <button
                            className="px-3 py-1.5 bg-gray-600 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors"
                            title="다중 영상 크기 조정"
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-gray-400" />
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={brightness}
                                onChange={(e) => setBrightness(Number(e.target.value))}
                                className="w-20"
                            />
                            <span className="text-sm text-gray-300 w-8">{brightness}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Contrast className="h-4 w-4 text-gray-400" />
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={contrast}
                                onChange={(e) => setContrast(Number(e.target.value))}
                                className="w-20"
                            />
                            <span className="text-sm text-gray-300 w-8">{contrast}</span>
                        </div>
                        <button className="px-3 py-1.5 bg-gray-600 border border-gray-500 text-gray-200 hover:bg-gray-500 rounded-md transition-colors">
                            <Settings className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Viewer Area */}
                <div className="flex-1 bg-gray-800 p-4">
                    {selectedPatient && (
                        <div className="h-full flex flex-col">
                            {/* Image Viewer with Cornerstone */}
                            <div
                                className="flex-1 bg-black rounded-lg border border-gray-600 flex items-center justify-center relative overflow-hidden min-h-0">
                                {/* Patient Info Overlay - Top Left */}
                                <div
                                    className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-10">
                                    <div className="font-semibold">{selectedPatient.name}</div>
                                    <div className="text-gray-300">
                                        {selectedPatient.age}세 • {selectedPatient.gender === "M" ? "남성" : "여성"} •
                                        ID: {selectedPatient.id}
                                    </div>
                                </div>

                                {/* Modality Info Overlay - Bottom Right */}
                                <div
                                    className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-10">
                                    <div className="font-semibold">{selectedPatient.modality}</div>
                                    <div className="text-gray-300">{selectedPatient.studyDescription}</div>
                                </div>

                                <div className="w-full h-full overflow-auto flex items-center justify-center">
                                    <div
                                        ref={viewerRef}
                                        className="w-full h-full"
                                        style={{background: "black"}}
                                    />
                                </div>

                                {measureMode && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <svg className="w-full h-full">
                                            <line x1="100" y1="100" x2="200" y2="150" stroke="#00ff00" strokeWidth="2" />
                                            <text x="150" y="120" fill="#00ff00" fontSize="12">
                                                25.4mm
                                            </text>
                                        </svg>
                                    </div>
                                )}

                                {/* 영상 로딩 상태나 오류 표시 */}
                                <div
                                    className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-10">
                                    <div className="text-gray-300">
                                        밝기: {brightness}% | 대비: {contrast}% | 확대: {zoomLevel}% | 회전: {rotation}°
                                    </div>
                                    {measureMode && <div className="text-green-400 mt-1">측정 모드 활성화</div>}
                                    <div className="text-gray-300 mt-1">
                                        이미지: {selectedImageIndex + 1} / {selectedPatient.images.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}