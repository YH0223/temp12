/**
 * 디자인 시스템 및 테마 설정
 */

export const DESIGN_SYSTEM = {
  // 컬러 팔레트
  colors: {
    // Primary Colors
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Main red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Gray Colors (Dark Theme)
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151', // Sidebar border
      800: '#1f2937', // Main background
      900: '#111827', // Header background
    },
    
    // Semantic Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Medical UI Specific
    medical: {
      background: '#000000', // DICOM viewer background
      overlay: 'rgba(0, 0, 0, 0.7)',
      measurement: '#00ff00',
      annotation: '#ffff00',
    },
  },
  
  // 타이포그래피
  typography: {
    fontFamily: {
      primary: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // 간격 시스템
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },
  
  // 레이아웃 크기
  layout: {
    header: {
      height: '4rem', // 64px
    },
    sidebar: {
      width: '16rem', // 256px
    },
    thumbnail: {
      height: '6rem', // 96px
    },
    toolbar: {
      height: '4rem', // 64px
    },
  },
  
  // 보더 라디우스
  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    full: '9999px',
  },
  
  // 그림자
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  
  // 애니메이션
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // Z-Index 시스템
  zIndex: {
    base: 0,
    dropdown: 10,
    overlay: 20,
    modal: 30,
    popover: 40,
    tooltip: 50,
  },
} as const;

// CSS 변수로 내보내기 위한 유틸리티
export const getCSSVariables = () => {
  const cssVars: Record<string, string> = {};
  
  // 색상 변수
  Object.entries(DESIGN_SYSTEM.colors.primary).forEach(([key, value]) => {
    cssVars[`--color-primary-${key}`] = value;
  });
  
  Object.entries(DESIGN_SYSTEM.colors.gray).forEach(([key, value]) => {
    cssVars[`--color-gray-${key}`] = value;
  });
  
  // 레이아웃 변수
  Object.entries(DESIGN_SYSTEM.layout).forEach(([component, sizes]) => {
    Object.entries(sizes).forEach(([property, value]) => {
      cssVars[`--layout-${component}-${property}`] = value;
    });
  });
  
  return cssVars;
};
