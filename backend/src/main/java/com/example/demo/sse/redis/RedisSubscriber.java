package com.example.demo.sse.redis;

import com.example.demo.sse.SseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class RedisSubscriber {
    private final SseService sseService;
    private final ObjectMapper objectMapper;

    public void subscribe(String message) {
        try {
            Map<String, Object> map =
                    objectMapper.readValue(message, Map.class);
            Integer doctorId = (Integer) map.get("doctorId");
            Object data = map.get("data");
            sseService.sendNewReservation(doctorId, data);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
