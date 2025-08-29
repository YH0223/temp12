package com.example.dicomproject.userrepo.repository;

import com.example.dicomproject.userrepo.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {}