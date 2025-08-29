package com.example.dicomproject.userrepo.service;

import com.example.dicomproject.userrepo.entity.AuditLog;
import com.example.dicomproject.userrepo.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository repo;

    @Transactional
    public void write(AuditLog log) {
        if (log.getEventTime() == null) log.setEventTime(LocalDateTime.now(ZoneOffset.UTC));
        if (log.getCreatedAt() == null) log.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        repo.save(log);
    }
}