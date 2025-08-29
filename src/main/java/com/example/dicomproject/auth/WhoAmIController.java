package com.example.dicomproject.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/secure")
public class WhoAmIController {

    @GetMapping("/whoami")
    public ResponseEntity<?> whoami(java.security.Principal principal,
                                    org.springframework.security.core.Authentication auth) {
        if (principal == null || auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "unauthorized", "reason", "no_authentication"));
        }
        return ResponseEntity.ok(Map.of(
                "name", principal.getName(),
                "authorities", auth.getAuthorities().stream().map(Object::toString).toList()
        ));
    }
}