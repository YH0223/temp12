/**
 * DICOM 뷰어 상태 관리 훅
 */

import { useReducer, useCallback, useRef, useEffect } from 'react';
import type { Viewport } from 'cornerstone-core';
import { ViewerState, Patient, ThumbnailState } from '@/types/medical.types';
import { APP_CONFIG } from '@/config/app.config';

// 액션 타입
type ViewerAction =
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_BRIGHTNESS'; payload: number }
  | { type: 'SET_CONTRAST'; payload: number }
  | { type: 'SET_ROTATION'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'SET_WINDOW_LEVEL'; payload: { width: number; center: number } }
  | { type: 'TOGGLE_INVERT' }
  | { type: 'TOGGLE_MEASURE_MODE' }
  | { type: 'RESET_VIEWER' }
  | { type: 'ROTATE_LEFT' }
  | { type: 'ROTATE_RIGHT' }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' };

// 초기 상태
const initialViewerState: ViewerState = {
  zoomLevel: APP_CONFIG.viewer.defaultZoom,
  brightness: APP_CONFIG.viewer.defaultBrightness,
  contrast: APP_CONFIG.viewer.defaultContrast,
  rotation: APP_CONFIG.viewer.defaultRotation,
  pan: { x: 0, y: 0 },
  windowLevel: { width: 400, center: 40 },
  invert: false,
  measureMode: false,
};

// 리듀서
const viewerReducer = (state: ViewerState, action: ViewerAction): ViewerState => {
  switch (action.type) {
    case 'SET_ZOOM':
      return { ...state, zoomLevel: Math.max(10, Math.min(500, action.payload)) };
    
    case 'SET_BRIGHTNESS':
      return { ...state, brightness: Math.max(0, Math.min(200, action.payload)) };
    
    case 'SET_CONTRAST':
      return { ...state, contrast: Math.max(0, Math.min(200, action.payload)) };
    
    case 'SET_ROTATION':
      return { ...state, rotation: action.payload % 360 };
    
    case 'SET_PAN':
      return { ...state, pan: action.payload };
    
    case 'SET_WINDOW_LEVEL':
      return { ...state, windowLevel: action.payload };
    
    case 'TOGGLE_INVERT':
      return { ...state, invert: !state.invert };
    
    case 'TOGGLE_MEASURE_MODE':
      return { ...state, measureMode: !state.measureMode };
    
    case 'ROTATE_LEFT':
      return { ...state, rotation: (state.rotation - APP_CONFIG.viewer.rotationStep) % 360 };
    
    case 'ROTATE_RIGHT':
      return { ...state, rotation: (state.rotation + APP_CONFIG.viewer.rotationStep) % 360 };
    
    case 'ZOOM_IN':
      return { 
        ...state, 
        zoomLevel: Math.min(500, state.zoomLevel + APP_CONFIG.viewer.zoomStep) 
      };
    
    case 'ZOOM_OUT':
      return { 
        ...state, 
        zoomLevel: Math.max(10, state.zoomLevel - APP_CONFIG.viewer.zoomStep) 
      };
    
    case 'RESET_VIEWER':
      return initialViewerState;
    
    default:
      return state;
  }
};

// DICOM 뷰어 훅
export const useDicomViewer = () => {
  const [state, dispatch] = useReducer(viewerReducer, initialViewerState);
  const cornerstoneRef = useRef<any>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Cornerstone 동적 로딩
  const loadCornerstone = useCallback(async () => {
    if (!cornerstoneRef.current) {
      const [cornerstone, cornerstoneTools, cornerstoneWADOImageLoader, dicomParser] = 
        await Promise.all([
          import('cornerstone-core'),
          import('cornerstone-tools'),
          import('cornerstone-wado-image-loader'),
          import('dicom-parser'),
        ]);

      // WADO 이미지 로더 설정
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
      
      // 이미지 로더 등록
      cornerstone.registerImageLoader('wadouri', cornerstoneWADOImageLoader.wadouri.loadImage);
      cornerstone.registerImageLoader('wadors', cornerstoneWADOImageLoader.wadors.loadImage);
      cornerstone.registerImageLoader('dicomfile', cornerstoneWADOImageLoader.wadouri.loadImage);

      cornerstoneRef.current = {
        cornerstone,
        cornerstoneTools,
        cornerstoneWADOImageLoader,
      };
    }
    
    return cornerstoneRef.current;
  }, []);

  // 뷰어 초기화
  const initializeViewer = useCallback(async (element: HTMLDivElement) => {
    const { cornerstone, cornerstoneTools } = await loadCornerstone();
    
    if (!element) return;

    try {
      cornerstone.enable(element);
      
      // 도구 초기화
      cornerstoneTools.init();
      cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
      cornerstoneTools.addTool(cornerstoneTools.PanTool);
      cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
      cornerstoneTools.addTool(cornerstoneTools.RotateTool);
      cornerstoneTools.addTool(cornerstoneTools.LengthTool);
      
      // 도구 활성화
      cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 1 });
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });
      cornerstoneTools.setToolActive('WindowLevel', { mouseButtonMask: 4 });
      
    } catch (error) {
      console.error('뷰어 초기화 오류:', error);
      throw error;
    }
  }, [loadCornerstone]);

  // 이미지 로드
  const loadImage = useCallback(async (imageId: string) => {
    if (!elementRef.current || !cornerstoneRef.current) return;

    const { cornerstone } = cornerstoneRef.current;
    
    try {
      const image = await cornerstone.loadAndCacheImage(imageId);
      cornerstone.displayImage(elementRef.current, image);
      
      // 현재 상태로 뷰포트 업데이트
      updateViewport();
      
    } catch (error) {
      console.error('이미지 로딩 오류:', error);
      throw error;
    }
  }, []);

  // 뷰포트 업데이트
  const updateViewport = useCallback(() => {
    if (!elementRef.current || !cornerstoneRef.current) return;

    const { cornerstone } = cornerstoneRef.current;
    
    try {
      const viewport: Partial<Viewport> = {
        scale: state.zoomLevel / 100,
        rotation: state.rotation,
        translation: state.pan,
        voi: state.windowLevel,
        invert: state.invert,
      };
      
      cornerstone.setViewport(elementRef.current, viewport);
    } catch (error) {
      console.error('뷰포트 업데이트 오류:', error);
    }
  }, [state]);

  // 상태 업데이트 시 뷰포트 자동 적용
  useEffect(() => {
    updateViewport();
  }, [updateViewport]);

  // 액션 크리에이터들
  const actions = {
    setZoom: useCallback((zoom: number) => dispatch({ type: 'SET_ZOOM', payload: zoom }), []),
    setBrightness: useCallback((brightness: number) => dispatch({ type: 'SET_BRIGHTNESS', payload: brightness }), []),
    setContrast: useCallback((contrast: number) => dispatch({ type: 'SET_CONTRAST', payload: contrast }), []),
    setRotation: useCallback((rotation: number) => dispatch({ type: 'SET_ROTATION', payload: rotation }), []),
    setPan: useCallback((pan: { x: number; y: number }) => dispatch({ type: 'SET_PAN', payload: pan }), []),
    setWindowLevel: useCallback((windowLevel: { width: number; center: number }) => 
      dispatch({ type: 'SET_WINDOW_LEVEL', payload: windowLevel }), []),
    toggleInvert: useCallback(() => dispatch({ type: 'TOGGLE_INVERT' }), []),
    toggleMeasureMode: useCallback(() => dispatch({ type: 'TOGGLE_MEASURE_MODE' }), []),
    rotateLeft: useCallback(() => dispatch({ type: 'ROTATE_LEFT' }), []),
    rotateRight: useCallback(() => dispatch({ type: 'ROTATE_RIGHT' }), []),
    zoomIn: useCallback(() => dispatch({ type: 'ZOOM_IN' }), []),
    zoomOut: useCallback(() => dispatch({ type: 'ZOOM_OUT' }), []),
    reset: useCallback(() => dispatch({ type: 'RESET_VIEWER' }), []),
  };

  return {
    state,
    actions,
    elementRef,
    initializeViewer,
    loadImage,
    updateViewport,
  };
};

// 썸네일 상태 관리 훅
export const useThumbnailNavigation = (totalImages: number) => {
  const [thumbnailState, setThumbnailState] = useReducer(
    (state: ThumbnailState, partial: Partial<ThumbnailState>) => ({ ...state, ...partial }),
    {
      selectedIndex: 0,
      scrollIndex: 0,
      visibleCount: APP_CONFIG.thumbnail.visibleCount,
    }
  );

  const selectImage = useCallback((index: number) => {
    if (index >= 0 && index < totalImages) {
      setThumbnailState({ selectedIndex: index });
    }
  }, [totalImages]);

  const scrollLeft = useCallback(() => {
    setThumbnailState({ 
      scrollIndex: Math.max(0, thumbnailState.scrollIndex - 1) 
    });
  }, [thumbnailState.scrollIndex]);

  const scrollRight = useCallback(() => {
    const maxScroll = Math.max(0, totalImages - thumbnailState.visibleCount);
    setThumbnailState({ 
      scrollIndex: Math.min(maxScroll, thumbnailState.scrollIndex + 1) 
    });
  }, [totalImages, thumbnailState.scrollIndex, thumbnailState.visibleCount]);

  const canScrollLeft = thumbnailState.scrollIndex > 0;
  const canScrollRight = thumbnailState.scrollIndex < Math.max(0, totalImages - thumbnailState.visibleCount);

  return {
    thumbnailState,
    selectImage,
    scrollLeft,
    scrollRight,
    canScrollLeft,
    canScrollRight,
  };
};
