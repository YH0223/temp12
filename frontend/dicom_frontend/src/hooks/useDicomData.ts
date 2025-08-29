/**
 * DICOM 데이터 관리를 위한 React Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DicomManifest, DicomLoadingState } from '@/types/dicom.types';
import { loadDicomManifest, loadMultipleDicomManifests, globalDicomLoader } from '@/utils/dicom-loader';

// DICOM 데이터 상태 타입
interface DicomDataState {
  manifest: DicomManifest | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  loadedAt: Date | null;
}

/**
 * 단일 DICOM Study 데이터를 관리하는 Hook
 */
export function useDicomStudy(studyKey: number) {
  const [state, setState] = useState<DicomDataState>({
    manifest: null,
    isLoading: false,
    error: null,
    progress: 0,
    loadedAt: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadStudy = useCallback(async (key: number) => {
    // 이전 요청 중단
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 0
    }));

    try {
      const manifest = await loadDicomManifest(key, {
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
        }
      });

      // 요청이 중단되지 않았다면 상태 업데이트
      if (!abortControllerRef.current?.signal.aborted) {
        setState({
          manifest,
          isLoading: false,
          error: null,
          progress: 100,
          loadedAt: new Date()
        });
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          progress: 0
        }));
      }
    }
  }, []);

  const reload = useCallback(() => {
    if (studyKey) {
      loadStudy(studyKey);
    }
  }, [studyKey, loadStudy]);

  const clearData = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      manifest: null,
      isLoading: false,
      error: null,
      progress: 0,
      loadedAt: null
    });
  }, []);

  // studyKey 변경 시 자동 로드
  useEffect(() => {
    if (studyKey) {
      loadStudy(studyKey);
    } else {
      clearData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [studyKey, loadStudy, clearData]);

  return {
    ...state,
    reload,
    clearData
  };
}

/**
 * 다중 DICOM Study 데이터를 관리하는 Hook
 */
export function useDicomStudies(studyKeys: string[]) {
  const [state, setState] = useState<{
    manifests: Record<string, DicomManifest>;
    isLoading: boolean;
    error: string | null;
    progress: Record<string, number>;
    totalProgress: number;
    loadedAt: Date | null;
  }>({
    manifests: {},
    isLoading: false,
    error: null,
    progress: {},
    totalProgress: 0,
    loadedAt: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadStudies = useCallback(async (keys: string[]) => {
    if (keys.length === 0) {
      setState({
        manifests: {},
        isLoading: false,
        error: null,
        progress: {},
        totalProgress: 0,
        loadedAt: null
      });
      return;
    }

    // 이전 요청 중단
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: {},
      totalProgress: 0
    }));

    try {
      const manifests = await loadMultipleDicomManifests(keys, {
        onProgress: (studyKey, progress, totalProgress) => {
          setState(prev => ({
            ...prev,
            progress: {
              ...prev.progress,
              [studyKey]: progress
            },
            totalProgress
          }));
        }
      });

      // 요청이 중단되지 않았다면 상태 업데이트
      if (!abortControllerRef.current?.signal.aborted) {
        setState({
          manifests,
          isLoading: false,
          error: null,
          progress: Object.fromEntries(keys.map(key => [key, 100])),
          totalProgress: 100,
          loadedAt: new Date()
        });
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          totalProgress: 0
        }));
      }
    }
  }, []);

  const reload = useCallback(() => {
    loadStudies(studyKeys);
  }, [studyKeys, loadStudies]);

  const clearData = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      manifests: {},
      isLoading: false,
      error: null,
      progress: {},
      totalProgress: 0,
      loadedAt: null
    });
  }, []);

  // studyKeys 변경 시 자동 로드
  useEffect(() => {
    loadStudies(studyKeys);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [studyKeys, loadStudies]);

  return {
    ...state,
    reload,
    clearData
  };
}

/**
 * 전역 DICOM 로딩 상태를 관리하는 Hook
 */
export function useDicomLoadingState() {
  const [loadingState, setLoadingState] = useState<DicomLoadingState>(
    globalDicomLoader.getCurrentState()
  );

  useEffect(() => {
    const unsubscribe = globalDicomLoader.subscribe(setLoadingState);
    return unsubscribe;
  }, []);

  return loadingState;
}

/**
 * DICOM 이미지 캐시를 관리하는 Hook
 */
export function useDicomImageCache() {
  const [cache, setCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const [preloadProgress, setPreloadProgress] = useState<{
    loaded: number;
    total: number;
    isPreloading: boolean;
  }>({
    loaded: 0,
    total: 0,
    isPreloading: false
  });

  const preloadImages = useCallback(async (imageUrls: string[]) => {
    if (imageUrls.length === 0) return;

    setPreloadProgress({
      loaded: 0,
      total: imageUrls.length,
      isPreloading: true
    });

    const newCache = new Map(cache);
    let loaded = 0;

    for (const url of imageUrls) {
      if (!newCache.has(url)) {
        try {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`이미지 로드 실패: ${url}`));
            img.src = url;
          });
          newCache.set(url, img);
        } catch (error) {
          console.warn('이미지 사전 로드 실패:', url, error);
        }
      }
      
      loaded++;
      setPreloadProgress(prev => ({ ...prev, loaded }));
    }

    setCache(newCache);
    setPreloadProgress(prev => ({ ...prev, isPreloading: false }));
  }, [cache]);

  const getImage = useCallback((url: string): HTMLImageElement | null => {
    return cache.get(url) || null;
  }, [cache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
    setPreloadProgress({
      loaded: 0,
      total: 0,
      isPreloading: false
    });
  }, []);

  return {
    preloadImages,
    getImage,
    clearCache,
    cacheSize: cache.size,
    preloadProgress
  };
}
