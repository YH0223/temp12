package com.example.dicomproject.dicomrepo.service;


import com.example.dicomproject.dicomrepo.dto.*;
import com.example.dicomproject.dicomrepo.entity.Series;
import com.example.dicomproject.dicomrepo.entity.Study;
import com.example.dicomproject.dicomrepo.repository.ImageRepository;
import com.example.dicomproject.dicomrepo.repository.SeriesRepository;
import com.example.dicomproject.dicomrepo.repository.StudyRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true, transactionManager = "oracleTx")
public class DicomService {

    private final StudyRepository studyRepo;
    private final SeriesRepository seriesRepo;
    private final ImageRepository imageRepo;

    private final StudyRepository repo;

    public Page<StudySummaryDto> searchStudies(StudySearchCondition c, Pageable pageable) {
        List<String> modalities = parseModalities(emptyToNull(c.modality()));
        Page<StudyProjection> page = repo.search(
                emptyToNull(c.q()), // ↓ 필요 시 병합 함수
                emptyToNull(c.accession()),
                emptyToNull(c.studyDesc()),
                modalities,
                emptyToNull(c.bodyPart()),
                emptyToNull(c.fromDate()),
                emptyToNull(c.toDate()),
                pageable
        );
        return page.map(p -> new StudySummaryDto(
                p.getStudyKey(),
                p.getStudyUid(),
                p.getStudyDate(),
                p.getStudyTime(),
                p.getStudyDesc(),
                p.getModality(),
                p.getBodyPart(),
                p.getAccessionNum(),
                p.getPid(),
                p.getPname()
        ));
    }

    private String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static List<String> parseModalities(String csv) {
        if (csv == null || csv.isBlank()) return null; // 빈은 null
        List<String> list = Arrays.stream(csv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
        return list.isEmpty() ? null : list;
    }

    public List<SeriesSummaryDto> listSeries(String studyUid) {
        long key = Long.parseLong(studyUid);
        return seriesRepo.findByStudyKey(key)     // DB에서 Series 엔티티 목록 조회
                .stream()                         // 엔티티 리스트 → 스트림
                .map(this::toSeriesSummary)       // 엔티티 → DTO 매핑
                .toList();                        // 다시 리스트로 변환
    }

    public List<ImageSummaryDto> listInstances(String seriesUid) {
        return imageRepo.findBySeries_SeriesInstanceUid(seriesUid).stream()
                .map(i -> new ImageSummaryDto(i.getStudyKey(), i.getSeriesKey(), i.getImageKey(),
                        i.getSopInstanceUid(), i.getFname()))
                .toList();
    }

    public ImageMetaDto getInstanceMeta(String sopUid) {
        var i = imageRepo.findBySopInstanceUid(sopUid).orElseThrow();
        return new ImageMetaDto(
                i.getStudyKey(), i.getSeriesKey(), i.getImageKey(),
                i.getStudyInstanceUid(), i.getSeriesInstanceUid(), i.getSopInstanceUid(),
                tidyPath(i.getPath()), i.getFname(),
                // modality는 Series/Study에 있으므로 참고용
                null
        );
    }

    private String tidyPath(String p) {
        if (p == null) return "";
        String r = p.replace('\\', '/');
        if (r.startsWith("/")) r = r.substring(1);
        if (!r.endsWith("/") && !r.isEmpty()) r = r + "/";
        return r;
    }


    private SeriesSummaryDto toSeriesSummary(Series s) {
        return new SeriesSummaryDto(
                s.getStudy().getStudyKey(),   // Long studyKey
                s.getSeriesKey(),             // Long seriesKey
                s.getSeriesInstanceUid(),     // String
                s.getModality(),              // String
                s.getBodyPart(),              // String
                s.getImageCount()             // Integer
        );
    }
}