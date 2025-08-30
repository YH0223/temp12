package com.example.dicomproject.dicomrepo.controller;


import com.example.dicomproject.config.SmbStorage;
import com.example.dicomproject.dicomrepo.dto.ImageMetaDto;
import com.example.dicomproject.dicomrepo.dto.ImageSummaryDto;
import com.example.dicomproject.dicomrepo.dto.SeriesSummaryDto;
import com.example.dicomproject.dicomrepo.repository.ImageRepository;
import com.example.dicomproject.dicomrepo.repository.SeriesRepository;
import com.example.dicomproject.dicomrepo.service.DicomService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dicom")
@RequiredArgsConstructor
public class DicomStreamController {

    private final DicomService dicom;
    private final SmbStorage smb;
    private final ImageRepository imageRepository;
    private final SeriesRepository seriesRepository;
    public record StudyManifestDto(
            StudyInfo study,
            List<SeriesEntry> series
    ){}

    public record StudyInfo(
            String patientName,
            String studyDescription,
            String studyDate,        // YYYYMMDD 그대로
            String modality,         // 대표 모달리티(없으면 null)
            Integer numberOfSeries,
            Integer numberOfInstances,
            String studyInstanceUID
    ){}

    public record SeriesEntry(
            String seriesInstanceUID,
            String modality,
            Integer seriesNumber,        // 있으면 채우기
            String seriesDescription,    // 있으면 채우기
            Integer numberOfInstances,
            List<InstanceEntry> instances
    ){}

    public record InstanceEntry(
            String sopInstanceUid,
            String seriesInstanceUID,
            String modality,
            String fileUrl
    ){}

    @GetMapping(value = "/studies/{studyKey}/manifest", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> studyManifestTree(@PathVariable long studyKey) {
        // 0) 존재 검증(선택) - 존재하지 않으면 404
        // Optional<Study> studyEntity = studyRepository.findByStudyKey(studyKey); // 있으면 사용
        // if (studyEntity.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message","유효하지 않은 studyKey"));

        // 1) 모든 이미지 로우 (studyKey 기준)
        var rows = imageRepository.findAllByStudyKey(studyKey); // List<ImageMetaDto>
        // ImageMetaDto: sopInstanceUid(), seriesInstanceUid(), modality(), studyInstanceUid()

        // 2) 시리즈 목록 (빈 시리즈 포함)
        var seriesList = seriesRepository.findByStudyKeyOrderBySeriesKeyAsc(studyKey); // List<Series>
        // Series: getSeriesInstanceUid(), getModality(), getSeriesNumber(), getSeriesDescription() 등

        // 3) series UID별 그룹핑
        Map<String, List<ImageMetaDto>> bySeries = rows.stream()
                .collect(Collectors.groupingBy(ImageMetaDto::seriesInstanceUid, LinkedHashMap::new, Collectors.toList()));

        // 4) 시리즈 엔트리 변환
        List<SeriesEntry> seriesEntries = seriesList.stream().map(s -> {
            var list = bySeries.getOrDefault(s.getSeriesInstanceUid(), List.of());

            var instances = list.stream()
                    .map(r -> new InstanceEntry(
                            r.sopInstanceUid(),
                            r.seriesInstanceUid(),
                            r.modality(),
                            "http://localhost:8080/api/dicom/instances/" + r.sopInstanceUid() + "/file"
                    ))
                    .toList();

            Integer numberOfInstances = instances.size();

            return new SeriesEntry(
                    s.getSeriesInstanceUid(),
                    // 시리즈 모달리티(없으면 첫 인스턴스에서 가져오기)
                    firstNonNull(s.getModality(), list.stream().map(ImageMetaDto::modality).filter(Objects::nonNull).findFirst().orElse(null)),
                    s.getSeriesNum(),                   // 엔티티에 있으면 세팅
                    s.getSeriesDesc(),              // 엔티티에 있으면 세팅
                    numberOfInstances,
                    instances
            );
        }).toList();

        // 5) study 레벨 값 계산
        String studyInstanceUid = rows.isEmpty() ? null : rows.get(0).studyInstanceUid();

        // 대표 모달리티: series → image 순으로 탐색
        String representativeModality =
                seriesEntries.stream().map(SeriesEntry::modality).filter(Objects::nonNull).findFirst()
                        .orElseGet(() -> rows.stream().map(ImageMetaDto::modality).filter(Objects::nonNull).findFirst().orElse(null));

        int numberOfSeries    = seriesEntries.size();
        int numberOfInstances = seriesEntries.stream().mapToInt(se -> se.numberOfInstances() != null ? se.numberOfInstances() : 0).sum();

        // 6) study 엔티티에서 메타 끌어오거나 기본값
        // String patientName = studyEntity.map(Study::getPatientName).orElse("Anonymous");
        // String studyDesc   = studyEntity.map(Study::getStudyDescription).orElse("");
        // String studyDate   = studyEntity.map(Study::getStudyDate).orElse(null);

        String patientName = "Anonymous";     // TODO: 가능하면 DB에서 조회
        String studyDesc   = "";              // TODO: 가능하면 DB에서 조회
        String studyDate   = null;            // TODO: 가능하면 DB에서 조회(YYYYMMDD)

        StudyInfo studyInfo = new StudyInfo(
                patientName,
                studyDesc,
                studyDate,
                representativeModality,
                numberOfSeries,
                numberOfInstances,
                studyInstanceUid
        );

        StudyManifestDto body = new StudyManifestDto(studyInfo, seriesEntries);

        return ResponseEntity.ok(body);
    }

    // 유틸
    private static <T> T firstNonNull(T a, T b) { return a != null ? a : b; }

    @GetMapping(value = "/instances/{sopUid:.+}/file", produces = "application/dicom")
    public ResponseEntity<byte[]> streamDicom(
            @PathVariable String sopUid,
            HttpServletRequest request
    ) throws IOException {

        // 1) 메타에서 경로 구성
        var meta = dicom.getInstanceMeta(sopUid);
        String relativePath = meta.path() + meta.fname();

        // 2) 파일 크기
        long fileLength = smb.length(relativePath);

        // 3) Range 파싱
        String range = request.getHeader("Range"); // e.g. "bytes=0-1023"
        if (range == null) {
            // 전체 파일
            byte[] data = readAll(smb.open(relativePath), fileLength);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/dicom"))
                    .contentLength(fileLength)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(data);
        }

        // Partial
        long[] se = parseRange(range, fileLength);
        long start = se[0], end = se[1]; // inclusive
        long len = end - start + 1;

        try (InputStream in = smb.open(relativePath)) {
            in.skip(start);
            byte[] buf = readN(in, len);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(MediaType.parseMediaType("application/dicom"))
                    .contentLength(len)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileLength)
                    .body(buf);
        }
    }

    private static long[] parseRange(String header, long fileLen) {
        // "bytes=start-end" (end optional)
        String v = header.trim().toLowerCase().replace("bytes=", "");
        String[] p = v.split("-", 2);
        long start = Long.parseLong(p[0]);
        long end = (p.length > 1 && !p[1].isEmpty()) ? Long.parseLong(p[1]) : (fileLen - 1);
        if (end >= fileLen) end = fileLen - 1;
        if (start < 0 || start > end) throw new IllegalArgumentException("Invalid Range");
        return new long[]{start, end};
    }

    private static byte[] readAll(InputStream in, long size) throws IOException {
        try (in) {
            ByteArrayOutputStream out = new ByteArrayOutputStream((int) size);
            in.transferTo(out);
            return out.toByteArray();
        }
    }

    private static byte[] readN(InputStream in, long len) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream((int) len);
        byte[] buf = new byte[8192];
        long remaining = len;
        while (remaining > 0) {
            int toRead = (int) Math.min(buf.length, remaining);
            int r = in.read(buf, 0, toRead);
            if (r == -1) break;
            out.write(buf, 0, r);
            remaining -= r;
        }
        return out.toByteArray();
    }
}