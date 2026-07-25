package com.example.demo.schedule.aiSchedule.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PythonScheduleResponseDto {
    // Python이 반환하는 형태: { "scheduleList": [...] }
    private List<Map<String, Object>> scheduleList;
}