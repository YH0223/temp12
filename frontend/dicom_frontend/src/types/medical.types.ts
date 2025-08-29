/**
 * 의료 영상 관련 타입 정의
 */

// 환자 정보
export interface Patient {
    id: string; // 여기서는 studyUid를 사용하거나, pid+pname 등으로 고유하게 조합 가능
    patientId: string; // pid
    patientName: string; // pname
    studyKey?: number;
    modality: ModalityType;
      studyDescription: string;
      images: string[]; // DICOM 이미지 경로
      birthDate?: string;
      bodyPart: string;
      studyInstanceUID?: string;
      seriesInstanceUID?: string;
}

// 의료 영상 모달리티 타입
export type ModalityType = 
  | 'CT'      // Computed Tomography
  | 'MRI'     // Magnetic Resonance Imaging
  | 'X-Ray'   // X-Ray
  | 'US'      // Ultrasound
  | 'PET'     // Positron Emission Tomography
  | 'SPECT'   // Single Photon Emission Computed Tomography
  | 'CR'      // Computed Radiography
  | 'DR'      // Digital Radiography
  | 'MG'      // Mammography
  | 'DX'      // Digital X-Ray
  | 'RF'      // Radio Fluoroscopy
  | 'XA'      // X-Ray Angiography
  | 'NM'      // Nuclear Medicine
  | 'OT';     // Other

// 뷰 모드 타입
export type ViewMode = 'login' | 'signup' | 'main' | 'search' | 'viewer';

// 뷰어 상태
export interface ViewerState {
  zoomLevel: number;
  brightness: number;
  contrast: number;
  rotation: number;
  pan: {
    x: number;
    y: number;
  };
  windowLevel: {
    width: number;
    center: number;
  };
  invert: boolean;
  measureMode: boolean;
}

// 썸네일 상태
export interface ThumbnailState {
  selectedIndex: number;
  scrollIndex: number;
  visibleCount: number;
}

// 측정 도구 타입
export type MeasurementTool = 
  | 'length'    // 길이 측정
  | 'angle'     // 각도 측정
  | 'rectangle' // 사각형 ROI
  | 'circle'    // 원형 ROI
  | 'ellipse'   // 타원형 ROI
  | 'freehand'; // 자유형 ROI

// 측정 결과
export interface MeasurementResult {
  id: string;
  type: MeasurementTool;
  value: number;
  unit: string;
  coordinates: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  timestamp: string;
}

// DICOM 태그 정보
export interface DicomTag {
  tag: string;
  vr: string;  // Value Representation
  value: any;
  description?: string;
}

// DICOM 메타데이터
export interface DicomMetadata {
  patientName?: string;
  patientID?: string;
  studyDate?: string;
  studyTime?: string;
  modality?: ModalityType;
  studyDescription?: string;
  seriesDescription?: string;
  instanceNumber?: number;
  sliceThickness?: number;
  pixelSpacing?: [number, number];
  imageOrientation?: number[];
  imagePosition?: number[];
  windowCenter?: number;
  windowWidth?: number;
  rescaleIntercept?: number;
  rescaleSlope?: number;
  tags?: DicomTag[];
}

// 영상 정보
export interface ImageInfo {
  imageId: string;
  width: number;
  height: number;
  metadata: DicomMetadata;
  isLoaded: boolean;
  loadTime?: number;
  error?: string;
}

// 검색 필터
export interface SearchFilter {
  patientName?: string;
  patientId?: string;
  studyDate?: {
    from: string;
    to: string;
  };
  modality?: ModalityType[];
  studyDescription?: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 페이지네이션
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 환자 검색 응답
export interface PatientSearchResponse {
  patients: Patient[];
  pagination: Pagination;
}

// 로그인 요청/응답
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    permissions: Permission[];
  };
}

// 사용자 역할
export type UserRole = 'admin' | 'doctor' | 'technician' | 'viewer';

// 권한
export type Permission = 
  | 'view_images'
  | 'edit_annotations'
  | 'delete_images'
  | 'manage_users'
  | 'export_images'
  | 'print_images';

// 사용자 정보
export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  permissions: Permission[];
  lastLogin?: string;
  isActive: boolean;
}
// 백엔드의 StudySummaryDto에 맞춰 정의
export interface StudySummaryDto {
    studyKey: number;
    studyUid: string;
    studyDate: string;  // "YYYYMMDD"
    studyTime: string;  // "HHmmss"
    studyDesc?: string;
    modality: ModalityType;
    bodyPart?: string;
    accessionNum?: string;
    pid: string;         // 환자 ID
    pname: string;       // 환자명
}

// 백엔드의 Page<T> 응답에 맞춰 정의
export interface PagedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // 현재 페이지 번호 (0-based)
    size: number;   // 페이지당 아이템 수
    first: boolean;
    last: boolean;
    // 기타 페이징 정보 (필요시 추가)
}

export interface AuthResponse {
    accessToken: string
    refreshToken: string
    username: string
    displayName: string
}
