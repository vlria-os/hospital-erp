package com.example.demo.schedule.aiSchedule.controller;

import com.example.demo.schedule.aiSchedule.dto.DepartmentSchedulePolicyDto;
import com.example.demo.schedule.aiSchedule.service.SchedulePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule-policy")
@RequiredArgsConstructor
public class SchedulePolicyController {
    private final SchedulePolicyService schedulePolicyService;

    // 전체 목록 조회
    @GetMapping("/list")
    public ResponseEntity<List<DepartmentSchedulePolicyDto>> getAllPolicies() {
        return ResponseEntity.ok(schedulePolicyService.getAllPolicies());
    }

    // 단건 조회
    @GetMapping("/{policyId}")
    public ResponseEntity<DepartmentSchedulePolicyDto> getPolicy(@PathVariable Integer policyId) {
        return ResponseEntity.ok(schedulePolicyService.getPolicyById(policyId));
    }

    // 등록
    @PostMapping
    public ResponseEntity<DepartmentSchedulePolicyDto> createPolicy(@RequestBody DepartmentSchedulePolicyDto dto) {
        return ResponseEntity.ok(schedulePolicyService.createPolicy(dto));
    }

    // 수정
    @PutMapping("/{policyId}")
    public ResponseEntity<DepartmentSchedulePolicyDto> updatePolicy(
            @PathVariable Integer policyId,
            @RequestBody DepartmentSchedulePolicyDto dto) {
        return ResponseEntity.ok(schedulePolicyService.updatePolicy(policyId, dto));
    }

    // 비활성화
    @DeleteMapping("/{policyId}")
    public ResponseEntity<Void> deactivatePolicy(@PathVariable Integer policyId) {
        schedulePolicyService.deactivatePolicy(policyId);
        return ResponseEntity.noContent().build();
    }
}
