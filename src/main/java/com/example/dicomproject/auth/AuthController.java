package com.example.dicomproject.Auth;



import com.example.dicomproject.userrepo.dto.*;
import com.example.dicomproject.userrepo.entity.RefreshToken;
import com.example.dicomproject.userrepo.entity.Role;
import com.example.dicomproject.userrepo.entity.UserAccount;
import com.example.dicomproject.userrepo.repository.RefreshTokenRepository;
import com.example.dicomproject.userrepo.repository.RoleRepository;
import com.example.dicomproject.userrepo.repository.UserRepository;
import com.example.dicomproject.Auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
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
        if (userRepository.existsByUsername(req.username())) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        UserAccount user = new UserAccount();
        user.setUsername(req.username());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setDisplayName(req.displayName());
        user.setEnabled(true);

        // 기본 ROLE_USER 부여 (없으면 생성)
        Role roleUser = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("ROLE_USER");
                    return roleRepository.save(r);
                });
        user.setRoles(Set.of(roleUser));

        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    // 로그인 → 액세스/리프레시 발급
    @PostMapping("/login")
    @Transactional(transactionManager = "mariaTx")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        var user = userRepository.findWithRolesByUsername(req.username())
                .orElse(null);

        if (user == null || !user.isEnabled() ||
                !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        var claims = Map.<String,Object>of(
                "roles", user.getRoles().stream().map(Role::getName).toList()
        );
        String access  = jwt.generateAccessToken(user.getUsername(), claims);
        String refresh = jwt.generateRefreshToken(user.getUsername());

        // 기존 리프레시 제거 후 저장(선택 정책)
        refreshTokenRepository.deleteByUser(user);
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setToken(refresh);
        rt.setExpiresAt(LocalDateTime.now().plusDays(14)); // properties와 일치
        refreshTokenRepository.save(rt);

        return ResponseEntity.ok(new AuthResponse(
                access, refresh, "Bearer", jwt.getAccessExpiresInSec(access),
                user.getUsername(), user.getDisplayName()
        ));
    }

    // 리프레시 → 새 액세스(+선택: 새 리프레시)
    @PostMapping("/refresh")
    @Transactional(transactionManager = "mariaTx")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req) {
        var saved = refreshTokenRepository.findByToken(req.refreshToken()).orElse(null);
        if (saved == null || saved.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(401).body("Invalid/expired refresh token");
        }

        String username;
        try {
            username = jwt.getSubject(req.refreshToken());
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid token signature");
        }

        var user = userRepository.findWithRolesByUsername(username).orElse(null);
        if (user == null || !user.isEnabled()) {
            return ResponseEntity.status(401).body("User not found/disabled");
        }

        var claims = Map.<String,Object>of(
                "roles", user.getRoles().stream().map(Role::getName).toList()
        );
        String newAccess = jwt.generateAccessToken(user.getUsername(), claims);

        // 순환 발급 정책: 리프레시도 새로 갱신
        String newRefresh = jwt.generateRefreshToken(user.getUsername());
        saved.setToken(newRefresh);
        saved.setExpiresAt(LocalDateTime.now().plusDays(14));

        return ResponseEntity.ok(new AuthResponse(
                newAccess, newRefresh, "Bearer", jwt.getAccessExpiresInSec(newAccess),
                user.getUsername(), user.getDisplayName()
        ));
    }
    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String h) {
        String token = h.substring(7);
        String jti = jwt.getJti(token);
        long secondsLeft = jwt.getAccessExpiresInSec(token);
        tokenStore.blacklist(jti, Duration.ofSeconds(Math.max(0, secondsLeft)));
        return ResponseEntity.ok().build();
    }
}
