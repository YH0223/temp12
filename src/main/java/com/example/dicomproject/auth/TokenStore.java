package com.example.dicomproject.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TokenStore {
    private final RedisTemplate<String, Object> redis;

    private String blKey(String jti) { return "jwt:blacklist:" + jti; }
    private String rfKey(String username) { return "jwt:refresh:" + username; }

    public void blacklist(String jti, Duration ttl) {
        redis.opsForValue().set(blKey(jti), true, ttl);
    }
    public boolean isBlacklisted(String jti) {
        Boolean v = (Boolean) redis.opsForValue().get(blKey(jti));
        return Boolean.TRUE.equals(v);
    }

    public void saveRefresh(String username, String token, Duration ttl) {
        redis.opsForValue().set(rfKey(username), token, ttl);
    }
    public Optional<String> getRefresh(String username) {
        Object v = redis.opsForValue().get(rfKey(username));
        return Optional.ofNullable((String) v);
    }
    public void deleteRefresh(String username) {
        redis.delete(rfKey(username));
    }
}