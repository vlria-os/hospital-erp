package com.example.demo.sse.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class RedisPublisher {
    private final RedisTemplate<String,Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public void publish(Integer doctorId, Object data) {
        try {
            String message = objectMapper.writeValueAsString(
                    Map.of("doctorId", doctorId, "data", data)
            );
            redisTemplate.convertAndSend("reservation", message);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
