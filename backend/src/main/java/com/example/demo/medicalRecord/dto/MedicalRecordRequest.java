package com.example.demo.medicalRecord.dto;

import com.example.demo.medicalRecord.MedicalRecord;
import com.example.demo.medicalRecord.MedicalRecordStatus;
import com.example.demo.patient.Patient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class MedicalRecordRequest {
    private Integer patientId;
    private MedicalRecordStatus medicalRecordStatus;
    private String title;
    private String symptom;
    private String content;
    private Boolean isSensitive;

    public MedicalRecord toEntity(MedicalRecordRequest req){
        return MedicalRecord.builder()
                .patient(
                        Patient.builder()
                                .patientId(req.getPatientId())
                                .build()
                )
                .medicalRecordStatus(req.getMedicalRecordStatus())
                .title(req.getTitle())
                .content(req.getContent())
                .isSensitive(req.getIsSensitive())
                .isFinal(false)
                .build();
    }
}
