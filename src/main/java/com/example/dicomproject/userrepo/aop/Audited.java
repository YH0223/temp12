package com.example.dicomproject.userrepo.aop;

import com.example.dicomproject.userrepo.enums.AuditAction;
import com.example.dicomproject.userrepo.enums.ResourceType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
    AuditAction action();
    ResourceType resourceType() default ResourceType.OTHER;
    String resourceIdExpression() default ""; // SpEL로 메서드 파라미터에서 추출
}