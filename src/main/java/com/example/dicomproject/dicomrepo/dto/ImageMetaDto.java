package com.example.dicomproject.dicomrepo.dto;


public record ImageMetaDto(
        Long studyKey,
        Long seriesKey,
        Long imageKey,
        String studyInstanceUid,
        String seriesInstanceUid,
        String sopInstanceUid,
        String path,   // 폴더
        String fname,  // 파일명
        String modality
) {}