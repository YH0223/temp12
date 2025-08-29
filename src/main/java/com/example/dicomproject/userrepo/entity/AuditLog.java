package com.example.dicomproject.userrepo.entity;

import com.example.dicomproject.userrepo.enums.AuditAction;
import com.example.dicomproject.userrepo.enums.AuditResult;
import com.example.dicomproject.userrepo.enums.ResourceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pacs_audit_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private LocalDateTime eventTime; // UTC

    private Long userId;
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=64)
    private AuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=64)
    private ResourceType resourceType;

    private String resourceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=16)
    private AuditResult result;

    private String httpMethod;
    @Column(length=512)
    private String httpPath;

    private String clientIp;
    @Column(length=256)
    private String userAgent;

    private String requestId;
    private String correlationId;

    private Integer latencyMs;

    @Lob
    private String detail;

    @Column(nullable=false, length=64)
    private String serviceName;

    @Column(nullable=false)
    private LocalDateTime createdAt;
}