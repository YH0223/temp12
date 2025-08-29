/**
 * 애플리케이션 전역 설정
 */

export const APP_CONFIG = {
  // 애플리케이션 정보
  name: '의료영상뷰어',
  version: '1.0.0',
  shortName: '의',
  
  // 썸네일 설정
  thumbnail: {
    visibleCount: 4,
    size: {
      width: 64,
      height: 64,
    },
    scrollStep: 80,
  },
  
  // 뷰어 기본 설정
  viewer: {
    defaultZoom: 100,
    defaultBrightness: 100,
    defaultContrast: 100,
    defaultRotation: 0,
    zoomStep: 10,
    rotationStep: 90,
  },
  
  // DICOM 설정
  dicom: {
    loaders: {
      wadouri: 'wadouri',
      wadors: 'wadors',
      dicomfile: 'dicomfile',
    },
    imageFormats: ['.dcm', '.dicom'],
  },
  
  // 네비게이션 메뉴
  navigation: [
    { key: 'home', label: '홈', path: '/main' },
    { key: 'search', label: '환자 검색', path: '/search' },
    { key: 'reading', label: '판독', path: '/reading' },
    { key: 'report', label: '리포트', path: '/report' },
    { key: 'statistics', label: '통계', path: '/statistics' },
    { key: 'settings', label: '설정', path: '/settings' },
    { key: 'help', label: '도움말', path: '/help' },
  ],
  
  // 사이드바 메뉴
  sidebar: [
    { key: 'search', label: '환자 검색', icon: 'Search' },
    { key: 'viewer', label: '영상 보기', icon: 'FolderOpen' },
    { key: 'database', label: '데이터베이스', icon: 'Database' },
    { key: 'monitoring', label: '모니터링', icon: 'Activity' },
  ],
} as const;

export type NavigationKey = typeof APP_CONFIG.navigation[number]['key'];
export type SidebarKey = typeof APP_CONFIG.sidebar[number]['key'];
