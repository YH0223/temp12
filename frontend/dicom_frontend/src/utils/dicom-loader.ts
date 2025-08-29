/**
 * DICOM 데이터 로더 유틸리티
 */

import { DicomManifest, DicomApiResponse, DicomLoadingState } from '@/types/dicom.types';

// API 기본 설정
const DICOM_API_BASE = 'http://localhost:8080/api/dicom';
const DEFAULT_TIMEOUT = 30000; // 30초

/**
 * DICOM Study Manifest 조회
 */
export async function loadDicomManifest(
  studyKey: string,
  options: {
    timeout?: number;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<DicomManifest> {
  const { timeout = DEFAULT_TIMEOUT, onProgress } = options;

  if (!studyKey ) {
    throw new Error('유효하지 않은 studyKey입니다.');
  }

  // 진행률 업데이트
  onProgress?.(10);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    onProgress?.(30);

    const response = await fetch(`${DICOM_API_BASE}/studies/${studyKey}/manifest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    onProgress?.(70);

    if (!response.ok) {
      const fallbackText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} ${fallbackText}`);
    }

    const parsed = await response.json();
    onProgress?.(90);

    // 백엔드가 success/data 래퍼 없이 순수 manifest를 반환할 수 있으므로 양쪽 모두 허용
    if (parsed && typeof parsed === 'object' && 'success' in parsed) {
      const result = parsed as DicomApiResponse<DicomManifest>;
      if (!result.success || !result.data) {
        throw new Error(result.message || 'DICOM manifest 조회에 실패했습니다.');
      }
      onProgress?.(100);
      return result.data;
    }

    onProgress?.(100);
    return parsed as DicomManifest;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`요청 시간 초과: ${timeout}ms 내에 응답을 받지 못했습니다.`);
      }
      throw error;
    }
    throw new Error('알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 다중 Study Manifest 조회
 */
export async function loadMultipleDicomManifests(
  studyKeys: string[],
  options: {
    timeout?: number;
    onProgress?: (studyKey: string, progress: number, totalProgress: number) => void;
  } = {}
): Promise<Record<string, DicomManifest>> {
  const { timeout = DEFAULT_TIMEOUT, onProgress } = options;

  if (!Array.isArray(studyKeys) || studyKeys.length === 0) {
    throw new Error('유효하지 않은 studyKeys입니다.');
  }

  const results: Record<string, DicomManifest> = {};
  const errors: Record<string, string> = {};

  for (let i = 0; i < studyKeys.length; i++) {
    const studyKey = studyKeys[i];
    const totalProgress = Math.floor((i / studyKeys.length) * 100);

    try {
      onProgress?.(studyKey, 0, totalProgress);

      const manifest = await loadDicomManifest(studyKey, {
        timeout,
        onProgress: (progress) => onProgress?.(studyKey, progress, totalProgress)
      });

      results[studyKey] = manifest;
      onProgress?.(studyKey, 100, Math.floor(((i + 1) / studyKeys.length) * 100));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      errors[studyKey] = errorMessage;
      console.error(`DICOM manifest 로드 실패 (${studyKey}):`, errorMessage);
    }
  }

  if (Object.keys(results).length === 0) {
    throw new Error(`모든 Study 로드에 실패했습니다: ${JSON.stringify(errors)}`);
  }

  if (Object.keys(errors).length > 0) {
    console.warn('일부 Study 로드에 실패했습니다:', errors);
  }

  return results;
}

/**
 * DICOM 이미지 URL 유효성 검사 및 사전 로드
 */
export async function preloadDicomImages(
  imageUrls: string[],
  options: {
    maxConcurrent?: number;
    timeout?: number;
    onProgress?: (loaded: number, total: number) => void;
  } = {}
): Promise<{ success: string[]; failed: string[] }> {
  const { maxConcurrent = 5, timeout = 10000, onProgress } = options;

  const success: string[] = [];
  const failed: string[] = [];
  let loaded = 0;

  const loadImage = async (url: string): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD', // 헤더만 확인
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        success.push(url);
      } else {
        failed.push(url);
      }
    } catch (error) {
      failed.push(url);
    } finally {
      loaded++;
      onProgress?.(loaded, imageUrls.length);
    }
  };

  // 동시 로드 제한을 위한 Promise 풀 관리
  const executeInBatches = async () => {
    for (let i = 0; i < imageUrls.length; i += maxConcurrent) {
      const batch = imageUrls.slice(i, i + maxConcurrent);
      await Promise.all(batch.map(loadImage));
    }
  };

  await executeInBatches();

  return { success, failed };
}

/**
 * DICOM 로딩 상태 관리 클래스
 */
export class DicomLoadingManager {
  private listeners: Set<(state: DicomLoadingState) => void> = new Set();
  private currentState: DicomLoadingState = {
    isLoading: false,
    progress: 0
  };

  subscribe(listener: (state: DicomLoadingState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private updateState(updates: Partial<DicomLoadingState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  startLoading(currentFile?: string): void {
    this.updateState({
      isLoading: true,
      progress: 0,
      currentFile,
      error: undefined
    });
  }

  updateProgress(progress: number, currentFile?: string): void {
    this.updateState({
      progress: Math.max(0, Math.min(100, progress)),
      currentFile
    });
  }

  finishLoading(): void {
    this.updateState({
      isLoading: false,
      progress: 100,
      currentFile: undefined,
      error: undefined
    });
  }

  setError(error: string): void {
    this.updateState({
      isLoading: false,
      error
    });
  }

  getCurrentState(): DicomLoadingState {
    return { ...this.currentState };
  }
}

// 전역 로딩 매니저 인스턴스
export const globalDicomLoader = new DicomLoadingManager();
