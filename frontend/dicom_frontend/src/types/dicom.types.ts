/**
 * DICOM API 관련 타입 정의
 */

// DICOM Study 관련 타입
export interface DicomStudy {
  studyKey: string;
  studyInstanceUID: string;
  patientID: string;
  patientName: string;
  studyDate: string;
  studyTime: string;
  studyDescription: string;
  modality: string;
  numberOfSeries: number;
  numberOfInstances: number;
}

// DICOM Series 관련 타입
export interface DicomSeries {
  seriesKey: string;
  seriesInstanceUID: string;
  seriesNumber: number;
  seriesDescription: string;
  modality: string;
  numberOfInstances: number;
  bodyPartExamined?: string;
  viewPosition?: string;
}

// DICOM Instance (이미지) 관련 타입
export interface DicomInstance {
  instanceKey: string;
  sopInstanceUID: string;
  instanceNumber: number;
  // 선택적으로 실제 DICOM 접근 경로를 제공할 수 있다
  // 1) DICOMweb WADO-URI 전체 URL
  wadoUri?: string;
  // 2) 서버 파일 시스템상의 절대 경로 (UNC)
  filePath?: string;
  // 3) 미리 조합된 cornerstone imageId
  imageId?: string;
  // 4) 백엔드가 제공하는 파일 다운로드/직접 접근 URL (상대/절대)
  fileUrl?: string;
  url?: string;
  imagePosition?: number[];
  imageOrientation?: number[];
  pixelSpacing?: number[];
  sliceThickness?: number;
  sliceLocation?: number;
  windowCenter?: number;
  windowWidth?: number;
  rescaleIntercept?: number;
  rescaleSlope?: number;
  bitsAllocated?: number;
  bitsStored?: number;
  highBit?: number;
  pixelRepresentation?: number;
  photometricInterpretation?: string;
  rows?: number;
  columns?: number;
  // 데모/PNG 용. 실제 DICOM 사용 시 imageId/wadoUri/filePath 중 하나 사용
  imageURL?: string;
}

// DICOM Manifest (Study의 전체 구조)
export interface DicomManifest {
  study: DicomStudy;
  series: DicomSeries[];
  instances: {
    [seriesKey: string]: DicomInstance[];
  };
}

// API 응답 타입
export interface DicomApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// DICOM 로딩 상태
export interface DicomLoadingState {
  isLoading: boolean;
  progress: number;
  currentFile?: string;
  error?: string;
}

// DICOM 뷰어 설정
export interface DicomViewerSettings {
  windowCenter: number;
  windowWidth: number;
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  invert: boolean;
  annotations: boolean;
  measurements: boolean;
}
