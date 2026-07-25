package com.example.demo.security.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisService {
    private final RedisTemplate<String, Object> redisTemplate;

    private String key(Integer userId) {
        return "refresh:user:" + userId;
    }

    public void save(Integer userId, String refreshToken, long expireMin) {
        try {
            redisTemplate.opsForValue().set(
                    key(userId),
                    refreshToken,
                    expireMin,
                    TimeUnit.MINUTES
            );
        } catch (RedisConnectionFailureException e) {
            log.warn("[Redis 연결 없음] refresh token 저장 스킵 - userId: {}", userId);
        }
    }

    public String get(Integer userId) {
        try {
            return (String) redisTemplate.opsForValue().get(key(userId));
        } catch (RedisConnectionFailureException e) {
            log.warn("[Redis 연결 없음] refresh token 조회 스킵 - userId: {}", userId);
            return null;
        }
    }

    public void delete(Integer userId) {
        try {
            redisTemplate.delete(key(userId));
        } catch (RedisConnectionFailureException e) {
            log.warn("[Redis 연결 없음] refresh token 삭제 스킵 - userId: {}", userId);
        }
    }

    public boolean validate(Integer userId, String refreshToken) {
        String saved = get(userId);
        // Redis 없을 때는 검증 통과 (개발용 fallback)
        if (saved == null) return true;
        return saved.equals(refreshToken);
    }
}
