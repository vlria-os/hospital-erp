package com.example.demo.patient.dto;

import com.example.demo.patient.Patient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class PatientDto {
    private Integer patientId;
    private Integer userId;
    private String rrn;
    private String name;
    private String phone;
    private String address;
    private String gender;
    private String bloodType;
    private Float height;
    private Float weight;

    public PatientDto(Patient patient){
        this.patientId=patient.getPatientId();
        this.userId = patient.getUser().getUserId();
        this.rrn = patient.getRrn();
        this.name = patient.getName();
        this.phone = patient.getPhone();
        this.address = patient.getAddress();
        this.gender = patient.getGender();
        this.bloodType = patient.getBloodType();
        this.height = patient.getHeight();
        this.weight = patient.getWeight();
    }
}
