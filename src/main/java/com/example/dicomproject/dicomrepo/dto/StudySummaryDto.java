package com.example.dicomproject.dicomrepo.dto;

public record StudySummaryDto(
        long studyKey,
        String studyUid,        // ← Projection과 동일한 이름/의미
        String studyDate,
        String studyTime,
        String studyDesc,
        String modality,
        String bodyPart,
        String accessionNum,
        String pid,
        String pname
) {}