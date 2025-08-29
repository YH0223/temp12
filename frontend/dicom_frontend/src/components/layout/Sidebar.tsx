/**
 * 의료 영상 뷰어 사이드바 컴포넌트
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  FolderOpen, 
  Database, 
  Activity 
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { APP_CONFIG } from '@/config/app.config';
import { ViewMode } from '@/types/medical.types';

interface SidebarProps {
  currentView?: ViewMode;
}

// 아이콘 매핑
const iconMap = {
  Search,
  FolderOpen,
  Database,
  Activity,
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView = 'main' }) => {
  const { navigateTo } = useApp();

  const handleNavigate = (key: string) => {
    const viewMode = key === 'search' ? 'search' : 'main';
    navigateTo(viewMode);
  };

  const getItemStyle = (key: string) => {
    const isActive = (key === 'search' && currentView === 'search') || 
                    (key !== 'search' && currentView === 'main');
    
    return isActive 
      ? "w-full justify-start bg-gray-800 text-white border-r-2 border-red-500" 
      : "w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white";
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* 사이드바 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-200">메뉴</h2>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {APP_CONFIG.sidebar.map((item) => {
            const IconComponent = iconMap[item.icon as keyof typeof iconMap];
            
            return (
              <Button
                key={item.key}
                variant="ghost"
                onClick={() => handleNavigate(item.key)}
                className={getItemStyle(item.key)}
              >
                <IconComponent className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* 추가 도구들 */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide px-3 py-2">
            도구
          </div>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:bg-gray-800"
          >
            <Activity className="h-4 w-4 mr-3" />
            시스템 상태
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:bg-gray-800"
          >
            <Database className="h-4 w-4 mr-3" />
            데이터 백업
          </Button>
        </div>
      </nav>

      {/* 사이드바 푸터 */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          버전 {APP_CONFIG.version}
        </div>
      </div>
    </aside>
  );
};
