package com.example.dicomproject.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final Key key;
    private final long accessExpMin;
    private final long refreshExpDays;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-exp-min:60}") long accessExpMin,
            @Value("${jwt.refresh-exp-days:14}") long refreshExpDays
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpMin = accessExpMin;
        this.refreshExpDays = refreshExpDays;
    }

    public String generateAccessToken(String sub, Map<String,Object> claims) {
        String jti = UUID.randomUUID().toString();
        Instant now = Instant.now(), exp = now.plus(Duration.ofMinutes(accessExpMin));
        return Jwts.builder()
                .setId(jti).setSubject(sub)
                .addClaims(claims)
                .setIssuedAt(Date.from(now)).setExpiration(Date.from(exp))
                .signWith(key, SignatureAlgorithm.HS256).compact();
    }

    public String generateRefreshToken(String subject) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(Duration.ofDays(refreshExpDays))))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    public String getSubject(String token) {
        return parse(token).getBody().getSubject();
    }

    public long getAccessExpiresInSec(String token) {
        return Duration.ofMinutes(accessExpMin).toSeconds();
    }
    public String getJti(String token) { return parse(token).getBody().getId(); }

    private Jws<Claims> parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
    }
}