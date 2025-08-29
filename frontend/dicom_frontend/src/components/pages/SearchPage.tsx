/**
 * 환자 검색 페이지
 */

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { PatientSearch } from '@/components/medical/PatientSearch';
import { useApp } from '@/contexts/AppContext';
import { Patient } from '@/types/medical.types';
import{useEffect} from "react";

export const SearchPage: React.FC = () => {
  const { navigateTo, selectPatient } = useApp();

  const handlePatientSelect = (patient: Patient) => {
    selectPatient(patient);
  };
    console.debug('[SearchPage] render');
    useEffect(() => { console.debug('[SearchPage] mounted'); }, []);
  return (
    <div className="h-screen bg-gray-800 flex flex-col">
      <Header currentView="search" />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentView="search" />

        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 p-6 overflow-auto">
          <PatientSearch onPatientSelect={handlePatientSelect} />
        </main>
      </div>
    </div>
  );
};
