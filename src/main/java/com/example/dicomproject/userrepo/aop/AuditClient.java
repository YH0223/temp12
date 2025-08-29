package com.example.dicomproject.userrepo.aop;

import com.example.dicomproject.userrepo.dto.AuditLogDto;
import com.example.dicomproject.userrepo.enums.AuditAction;
import com.example.dicomproject.userrepo.enums.ResourceType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import org.slf4j.MDC;


@Component
@RequiredArgsConstructor
public class AuditClient {
    private final RestTemplate restTemplate;

    @Value("http://userrepo:8080/internal/audit") // 예: http://userrepo:8080/internal/audit
    String ingestUrl;

    /**
     * 공통 로깅 메서드: Aspect에서 이걸 호출하세요.
     */
    public void log(
            String username,
            AuditAction action,
            ResourceType resourceType,
            String resourceId,
            boolean success,
            String requestId,
            String clientIp,
            String userAgent,
            int latencyMs
    ) {
        // MDC에 http 정보가 있으면 보강
        String httpMethod = safe(MDC.get("httpMethod"));
        String httpPath   = safe(MDC.get("httpPath"));
        String actionStr = action != null ? action.name() : null;
        String resourceTypeStr = resourceType != null ? resourceType.name() : null;

        AuditLogDto dto = new AuditLogDto(
                null,                  // eventTimeIso (수신측에서 now 처리 가능)
                null,                  // userId (필요 시 채우기)
                username,
                actionStr,
                resourceTypeStr,
                resourceId,
                success ? "SUCCESS" : "FAILURE",
                httpMethod,
                httpPath,
                clientIp,
                userAgent,
                requestId,
                requestId,            // correlationId = requestId 재사용
                latencyMs,
                null,                 // detail
                "dicomrepo"
        );

        try {
            restTemplate.postForEntity(ingestUrl, dto, Void.class);
        } catch (Exception e) {
            // 본 요청 흐름을 막지 않기 위해 예외 삼킵니다. 필요 시 warn 로그만 남기세요.
            // log.warn("audit send failed", e);
        }
    }

    /**
     * 기존 호출부와 호환을 위해 유지. 내부적으로 공통 log(...)로 위임.



    public void logStudyView(String username, String studyUid, boolean success,
                             String requestId, String ip, String ua) {
        log(username, "VIEW_STUDY", "DICOM_STUDY", studyUid, success, requestId, ip, ua, 0);
    }
    */

    private String safe(String s) { return (s == null || s.isBlank()) ? null : s; }
}
