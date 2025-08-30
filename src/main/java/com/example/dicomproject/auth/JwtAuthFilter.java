package com.example.dicomproject.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final TokenStore tokenStore;

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    // 필터를 아예 타지 않을 공개 경로들 (permitAll 과 일치)
    private static final String[] PUBLIC_PATTERNS = new String[] {
            "/api/auth/**",
            "/api/dicom/instances/**",   // DICOM 파일 스트리밍
            "/api/dicom/studies/**",     // 매니페스트/조회가 공개라면 포함
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // CORS preflight 우회
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        String uri = request.getRequestURI();
        for (String p : PUBLIC_PATTERNS) {
            if (PATH_MATCHER.match(p, uri)) return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        // 공개 경로/OPTIONS는 shouldNotFilter 로 이미 우회됨

        // 이미 인증돼 있으면 패스
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        // 토큰 없으면 조용히 통과 (최종 authorize 단계에서 필요시 401)
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            if (!jwtService.isValid(token)) {
                chain.doFilter(request, response);
                return;
            }

            // 블랙리스트 확인
            String jti = jwtService.getJti(token);
            if (jti != null && tokenStore.isBlacklisted(jti)) {
                chain.doFilter(request, response);
                return;
            }

            String username = jwtService.getSubject(token);
            if (username != null) {
                UserDetails details = userDetailsService.loadUserByUsername(username);
                var auth = new UsernamePasswordAuthenticationToken(
                        details, null, details.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ignore) {
            // 여기서 401을 직접 쓰지 않음 — 체인으로 넘겨서 최종 보안 규칙에 맡김
        }

        chain.doFilter(request, response);
    }
}
