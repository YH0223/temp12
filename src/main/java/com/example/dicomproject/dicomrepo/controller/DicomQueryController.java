package com.example.dicomproject.dicomrepo.controller;


import com.example.dicomproject.dicomrepo.dto.*;
import com.example.dicomproject.dicomrepo.service.DicomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dicom")
@RequiredArgsConstructor
public class DicomQueryController {

    private final DicomService dicom;

    @GetMapping("/query")
    public Page<StudySummaryDto> searchStudies(
            @RequestParam(required = false) String pid,
            @RequestParam(required = false) String accession,
            @RequestParam(required = false) String studyDesc,
            @RequestParam(required = false, name = "modality") List<String> modalityParams, // 반복 파라미터
            @RequestParam(required = false) String modality, // CSV 지원
            @RequestParam(required = false) String bodyPart,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String modalityCsv = (modalityParams != null && !modalityParams.isEmpty())
                ? String.join(",", modalityParams)
                : modality;

        return dicom.searchStudies(
                new StudySearchCondition(pid, accession, studyDesc, modalityCsv, bodyPart, fromDate, toDate),
                PageRequest.of(page, size)
        );
    }

    @GetMapping("/query/{studyUid}/series")
    public List<SeriesSummaryDto> listSeries(@PathVariable String studyUid) {
        return dicom.listSeries(studyUid);
    }

    @GetMapping("/query/{seriesUid}/instances")
    public List<ImageSummaryDto> listInstances(@PathVariable String seriesUid) {
        return dicom.listInstances(seriesUid);
    }

    @GetMapping("/instances/{sopUid}/meta")
    public ImageMetaDto getInstanceMeta(@PathVariable String sopUid) {
        return dicom.getInstanceMeta(sopUid);
    }
}