package com.example.dicomproject.dicomrepo.dto;

import java.util.List;

public record StudyDetailDto(
        Long studyKey,
        String studyInstanceUid,
        String pid,
        String pname,
        String studyDate,
        String studyTime,
        String modality,
        String bodyPart,
        String accessionNumber,
        Integer seriesCount,
        Integer imageCount,
        List<SeriesSummaryDto> series
) {}

