/**
 * 의료 영상 뷰어 헤더 컴포넌트
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { useApp, useAuth } from '@/contexts/AppContext';
import { APP_CONFIG } from '@/config/app.config';
import { ViewMode } from '@/types/medical.types';

interface HeaderProps {
  currentView?: ViewMode;
}

export const Header: React.FC<HeaderProps> = ({ currentView = 'main' }) => {
  const { navigateTo } = useApp();
  const { logout } = useAuth();

  const handleNavigate = (viewMode: ViewMode) => {
    navigateTo(viewMode);
  };

  const getNavigationItemStyle = (path: ViewMode) => {
    const isActive = currentView === path;
    return isActive 
      ? "text-white border-b-2 border-red-500" 
      : "text-gray-300 hover:text-white transition-colors";
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-6">
      {/* 로고 및 브랜드 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => handleNavigate('main')}
          className="flex items-center gap-3 p-2 hover:bg-gray-800"
        >
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {APP_CONFIG.shortName}
            </span>
          </div>
          <span className="text-white font-bold text-lg">
            {APP_CONFIG.name}
          </span>
        </Button>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex items-center gap-6 text-sm">
        {APP_CONFIG.navigation.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNavigate(item.path.replace('/', '') as ViewMode)}
            className={getNavigationItemStyle(item.path.replace('/', '') as ViewMode)}
          >
            {item.label}
          </button>
        ))}
        
        {/* 로그아웃 버튼 */}
        <Button
          variant="ghost"
          onClick={logout}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          로그아웃
        </Button>
      </nav>
    </header>
  );
};
