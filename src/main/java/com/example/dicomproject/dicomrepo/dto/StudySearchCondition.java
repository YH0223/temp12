package com.example.dicomproject.dicomrepo.dto;

public record StudySearchCondition(
        String q, String accession, String studyDesc,
        String modality, String bodyPart, String fromDate, String toDate
) {}
