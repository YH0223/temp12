// com.example.dicomproject.userrepo.aop.AuditAspect
package com.example.dicomproject.userrepo.aop;

import com.example.dicomproject.userrepo.aop.AuditClient; // 실제 경로에 맞게 수정
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.MDC;
import org.springframework.expression.Expression;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.*;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditClient auditClient;
    private final SpelExpressionParser parser = new SpelExpressionParser();

    @Around("@annotation(audited)")
    public Object around(ProceedingJoinPoint pjp, Audited audited) throws Throwable {
        long start = System.currentTimeMillis();

        // --- 요청 컨텍스트: MDC 우선, 없으면 RequestContextHolder에서 보충 ---
        String requestId = MDC.get("requestId");
        String clientIp  = MDC.get("clientIp");
        String userAgent = MDC.get("userAgent");
        String httpMethod= MDC.get("httpMethod");
        String httpPath  = MDC.get("httpPath");

        HttpServletRequest req = currentRequestOrNull();
        if (req != null) {
            if (clientIp == null)  clientIp  = extractClientIp(req);
            if (userAgent == null) userAgent = req.getHeader("User-Agent");
            if (httpMethod == null)httpMethod= req.getMethod();
            if (httpPath == null)  httpPath  = req.getRequestURI();
        }

        // --- 사용자 정보 ---
        String username = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            username = auth.getName();
        }

        // --- 리소스 ID: SpEL로 파라미터에서 추출 ---
        String resourceId = null;
        String expr = audited.resourceIdExpression();
        if (expr != null && !expr.isBlank()) {
            resourceId = evalSpelForMethodArgs(pjp, expr);
        }

        boolean success = false;
        try {
            Object ret = pjp.proceed();
            success = true;
            return ret;
        } finally {
            int latencyMs = (int) (System.currentTimeMillis() - start);

            // 원하는 로깅 시그니처에 맞춰 호출하세요.
            // 여기서는: auditClient.log(username, action, resourceType, resourceId, success, requestId, ip, ua, latency)
            auditClient.log(username, audited.action(), audited.resourceType(), resourceId,
                    success, requestId, clientIp, userAgent, latencyMs);
        }
    }

    private HttpServletRequest currentRequestOrNull() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }

    private String extractClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    private String evalSpelForMethodArgs(ProceedingJoinPoint pjp, String expression) {
        StandardEvaluationContext ctx = new StandardEvaluationContext();
        Object[] args = pjp.getArgs();
        String[] names = ((MethodSignature) pjp.getSignature()).getParameterNames();
        if (names != null) {
            for (int i = 0; i < names.length; i++) {
                ctx.setVariable(names[i], args[i]); // #paramName 방식
            }
        }
        Expression exp = parser.parseExpression(expression);
        Object val = exp.getValue(ctx);
        return val != null ? val.toString() : null;
    }
}
