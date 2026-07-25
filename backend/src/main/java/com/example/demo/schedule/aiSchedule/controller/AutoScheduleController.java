package com.example.demo.schedule.aiSchedule.controller;

import com.example.demo.schedule.aiSchedule.dto.AiScheduleResultDto;
import com.example.demo.schedule.aiSchedule.dto.AutoScheduleRequestDto;
import com.example.demo.schedule.aiSchedule.dto.ConfirmScheduleRequestDto;
import com.example.demo.schedule.aiSchedule.service.AutoScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auto-schedule")
@RequiredArgsConstructor
public class AutoScheduleController {

    private final AutoScheduleService autoScheduleService;

    // AI 스케줄 생성 (미리보기, 저장 안 함)
    @PostMapping("/generate")
    public ResponseEntity<AiScheduleResultDto> generateSchedule(
            @RequestBody AutoScheduleRequestDto request) {
        AiScheduleResultDto result = autoScheduleService.generateSchedule(request);
        return ResponseEntity.ok(result);
    }

    // 미리보기 확인 후 DB 저장
    @PostMapping("/confirm")
    public ResponseEntity<AiScheduleResultDto> confirmSchedule(
            @RequestBody ConfirmScheduleRequestDto request) {
        AiScheduleResultDto result = autoScheduleService.confirmSchedule(request);
        return ResponseEntity.ok(result);
    }
}
