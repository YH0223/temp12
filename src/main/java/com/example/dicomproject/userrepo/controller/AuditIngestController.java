package com.example.dicomproject.userrepo.controller;

import com.example.dicomproject.userrepo.dto.AuditLogDto;
import com.example.dicomproject.userrepo.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/audit") // 외부 차단, 내부 네트워크/인증 헤더로 보호
@RequiredArgsConstructor
public class AuditIngestController {
    private final AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<Void> ingest(@RequestBody AuditLogDto dto) {
        auditLogService.write(dto.toEntity());
        return ResponseEntity.accepted().build();
    }
}