package com.example.dicomproject.auth; // 권장: 소문자 패키지

import com.example.dicomproject.userrepo.dto.*;
import com.example.dicomproject.userrepo.entity.RefreshToken;
import com.example.dicomproject.userrepo.entity.Role;
import com.example.dicomproject.userrepo.entity.UserAccount;
import com.example.dicomproject.userrepo.repository.RefreshTokenRepository;
import com.example.dicomproject.userrepo.repository.RoleRepository;
import com.example.dicomproject.userrepo.repository.UserRepository;
import com.example.dicomproject.auth.JwtService;
import com.example.dicomproject.auth.TokenStore;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenStore tokenStore;
    private final JwtService jwt;

    // 회원가입
    @PostMapping("/signup")
    @Transactional(transactionManager = "mariaTx")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
        System.out.println("📥 Signup request: " + req);
        if (userRepository.existsByUsername(req.username())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        UserAccount user = new UserAccount();
        user.setUsername(req.username());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setDisplayName(req.displayName());
        user.setEnabled(true);

        Role roleUser = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("ROLE_USER");
                    return roleRepository.save(r);
                });
        user.setRoles(Set.of(roleUser));

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "signup ok"));
    }

    // 로그인 → 액세스/리프레시 발급
    @PostMapping("/login")
    @Transactional(transactionManager = "mariaTx")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        var user = userRepository.findWithRolesByUsername(req.username()).orElse(null);

        if (user == null || !user.isEnabled()
                || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        var claims = Map.<String,Object>of(
                "roles", user.getRoles().stream().map(Role::getName).toList()
        );
        String access  = jwt.generateAccessToken(user.getUsername(), claims);
        String refresh = jwt.generateRefreshToken(user.getUsername());

        // 기존 리프레시 제거 후 저장
        refreshTokenRepository.deleteByUser(user);
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setToken(refresh);
        rt.setExpiresAt(LocalDateTime.now().plusDays(14));
        refreshTokenRepository.save(rt);

        // expiresInSec: 토큰 남은 만료 (JwtService 시그니처에 맞춰 호출)
        long expiresInSec = jwt.getAccessExpiresInSec(access); // ← 또는 jwt.getAccessExpiresInSec(access)

        return ResponseEntity.ok(new AuthResponse(
                access, refresh, "Bearer", expiresInSec,
                user.getUsername(), user.getDisplayName()
        ));
    }

    // 리프레시 → 새 액세스(+선택: 새 리프레시)
    @PostMapping("/refresh")
    @Transactional(transactionManager = "mariaTx")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req) {
        var saved = refreshTokenRepository.findByToken(req.refreshToken()).orElse(null);
        if (saved == null || saved.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid/expired refresh token"));
        }

        String username;
        try {
            username = jwt.getSubject(req.refreshToken());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token signature"));
        }

        var user = userRepository.findWithRolesByUsername(username).orElse(null);
        if (user == null || !user.isEnabled()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found/disabled"));
        }

        var claims = Map.<String,Object>of(
                "roles", user.getRoles().stream().map(Role::getName).toList()
        );
        String newAccess = jwt.generateAccessToken(user.getUsername(), claims);

        // 순환 발급 정책: 리프레시도 갱신
        String newRefresh = jwt.generateRefreshToken(user.getUsername());
        saved.setToken(newRefresh);
        saved.setExpiresAt(LocalDateTime.now().plusDays(14));

        long expiresInSec = jwt.getAccessExpiresInSec(newAccess); // ← 또는 jwt.getAccessExpiresInSec(newAccess)

        return ResponseEntity.ok(new AuthResponse(
                newAccess, newRefresh, "Bearer", expiresInSec,
                user.getUsername(), user.getDisplayName()
        ));
    }

    // 로그아웃: Access 토큰 JTI 블랙리스트 등록
    @PostMapping("/logout") // ✅ /api/auth/logout (중복 제거)
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String h) {
        if (h == null || !h.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing Authorization header"));
        }
        String token = h.substring(7);
        String jti = jwt.getJti(token);

        long secondsLeft = jwt.getAccessExpiresInSec(token); // ← 또는 jwt.getAccessExpiresInSec(token)
        tokenStore.blacklist(jti, Duration.ofSeconds(Math.max(0, secondsLeft)));

        return ResponseEntity.ok(Map.of("message", "logout ok"));
    }
}
