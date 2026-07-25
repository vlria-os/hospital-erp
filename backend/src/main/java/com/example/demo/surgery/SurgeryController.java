package com.example.demo.surgery;

import com.example.demo.surgery.dto.SurgeryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SurgeryController {

    private final SurgeryService surgeryService;

    @PostMapping("/api/surgery")
    public Map<String, Object> scheduleSurgery(@RequestBody SurgeryDto dto) {
        return Map.of("content", surgeryService.scheduleSurgery(dto));
    }

    @PostMapping("/api/surgery/emergency")
    public Map<String, Object> scheduleEmergencySurgery(@RequestBody SurgeryDto dto) {
        return Map.of("content", surgeryService.scheduleEmergencySurgery(dto));
    }

    @PutMapping("/api/surgery")
    public Map<String, Object> updateSurgery(@RequestBody SurgeryDto dto) {
        return Map.of("content", surgeryService.updateSurgery(dto));
    }

    @DeleteMapping("/api/surgery/{id}")
    public Map<String, Object> cancelSurgery(@PathVariable Integer id) {
        surgeryService.cancelSurgery(id);
        return Map.of("message", "수술이 취소되었습니다.");
    }

    @GetMapping("/api/surgery")
    public Map<String, Object> getSurgeryList() {
        return Map.of("content", surgeryService.getSurgeryList());
    }
}