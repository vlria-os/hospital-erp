package com.example.demo.security.redis;

import com.example.demo.security.jwtutil.JWTUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class LogoutController {
    private final RedisService redisService;
    private final JWTUtil jwtUtil;

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String accessToken) {

        if (accessToken == null || !accessToken.startsWith("Bearer ")) {
            return ResponseEntity.ok("already logged out");
        }

        String token = accessToken.replace("Bearer ", "");

        Claims claims = jwtUtil.validateToken(token);
        Integer userId = (Integer) claims.get("userId");

        redisService.delete(userId);

        return ResponseEntity.ok("logout success");
    }
}
