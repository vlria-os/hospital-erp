package com.example.demo.medicalRecord;

import com.example.demo.medicalRecord.dto.MedicalRecordRequest;
import com.example.demo.medicalRecord.dto.MedicalRecordResponse;
import com.example.demo.reception.ReceptionStatus;
import com.example.demo.reception.dto.ReceptionResponse;
import com.example.demo.security.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MedicalRecordController {
    private final MedicalRecordService medicalRecordService;

    @GetMapping("/api/waitingList")
    public Page<ReceptionResponse> waitingList(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                               ReceptionStatus status,
                                               Pageable pageable){
        Integer userId=customUserDetails.getUserId();
        return medicalRecordService.waitingList(userId,status,pageable);
    }

    @GetMapping("/api/medicalrecord/patientInfo")
    public Map<String, Object> patientInfo(@RequestParam Integer patientId){
        return medicalRecordService.patientInfo(patientId);
    }

    @GetMapping("/api/medicalrecord/record")
    public Page<MedicalRecordResponse> medicalRecord(@RequestParam Integer patientId,
                                                     @RequestParam MedicalRecordStatus status,
                                                     @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                     Pageable pageable){

        return medicalRecordService.medicalRecord(patientId, status, pageable);
    }

    @GetMapping("/api/medicalrecord/record/detail")
    public MedicalRecordResponse medicalRecordDetail(@RequestParam Integer recordId,
                                                     @RequestParam(value = "reason", required = false) String reason,
                                                     @AuthenticationPrincipal CustomUserDetails customUserDetails){
        System.out.println("=================>"+recordId);
        return medicalRecordService.medicalRecordDetail(recordId, reason, customUserDetails);
    }

    @PostMapping("/api/medicalrecord")
    public Integer medicalRecordInsert(@RequestBody MedicalRecordRequest request,
                                       @AuthenticationPrincipal CustomUserDetails customUserDetails){
        Integer doctorId=3;
        System.out.println("===========>"+request.getSymptom());
        return medicalRecordService.MedicalRecordInsert(request, doctorId);
    }
}
