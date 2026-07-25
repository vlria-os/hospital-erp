package com.example.demo.aiDiagnosis;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AiDiagnosisController {
    private final AiDiagnosisService aiDiagnosisService;

    @GetMapping("/api/llm/record")
    public List<Map<String, Object>> getPatientRecords(@RequestParam Integer patientId,
                                                       @RequestParam Integer departmentId) {
        return aiDiagnosisService.getDiagnosisSets(patientId, departmentId);
    }
}
