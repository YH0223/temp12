package com.example.dicomproject.userrepo.dto;

import com.example.dicomproject.userrepo.entity.AuditLog;
import com.example.dicomproject.userrepo.enums.AuditAction;
import com.example.dicomproject.userrepo.enums.AuditResult;
import com.example.dicomproject.userrepo.enums.ResourceType;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public record AuditLogDto(
        String eventTimeIso, Long userId, String username,
        String action, String resourceType, String resourceId,
        String result, String httpMethod, String httpPath,
        String clientIp, String userAgent, String requestId, String correlationId,
        Integer latencyMs, String detail, String serviceName
) {
    public AuditLog toEntity() {
        return AuditLog.builder()
                .eventTime(eventTimeIso != null ? LocalDateTime.parse(eventTimeIso) : LocalDateTime.now(ZoneOffset.UTC))
                .userId(userId)
                .username(username)
                .action(AuditAction.valueOf(defaultOr(action,"OTHER")))
                .resourceType(ResourceType.valueOf(defaultOr(resourceType,"OTHER")))
                .resourceId(resourceId)
                .result(AuditResult.valueOf(defaultOr(result,"SUCCESS")))
                .httpMethod(httpMethod)
                .httpPath(httpPath)
                .clientIp(clientIp)
                .userAgent(userAgent)
                .requestId(requestId)
                .correlationId(correlationId)
                .latencyMs(latencyMs)
                .detail(detail)
                .serviceName(serviceName != null ? serviceName : "dicomrepo")
                .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
    }
    private static String defaultOr(String s, String d) { return (s==null||s.isBlank()) ? d : s; }
}
