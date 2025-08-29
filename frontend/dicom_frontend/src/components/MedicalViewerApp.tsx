/**
 * 리팩토링된 의료 영상 뷰어 메인 애플리케이션
 */

'use client';

import React from 'react';
import { useNavigation, useApp } from '@/contexts/AppContext';
import ModernLoginPage from './auth/ModernLoginPage';
import SignupPage from './signup-page';
import { MainDashboard } from './pages/MainDashboard';
import { SearchPage } from './pages/SearchPage';
import { ViewerPage } from './pages/ViewerPage';

export default function MedicalViewerApp() {
  const { viewMode } = useNavigation();
    const { state: { selectedPatient } } = useApp();

  switch (viewMode) {
    case 'login':
      return <ModernLoginPage />;
    
    case 'signup':
      return <SignupPage onSignupSuccess={function(): void {
          throw new Error("Function not implemented.");
      } } onBackToLogin={function(): void {
          throw new Error("Function not implemented.");
      } } />;
    
    case 'main':
      return <MainDashboard />;
    
    case 'search':
      return <SearchPage />;
    
    case 'viewer':
      // 선택된 환자의 식별자에서 우선순위대로 전달: studyInstanceUID > patientId > id
      const studyKey1 = selectedPatient.studyKey;
      return <ViewerPage studyKey={studyKey1} />;
    
    default:
      return <MainDashboard />;
  }
}
