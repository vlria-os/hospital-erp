package com.example.demo.surgery.dto;

import com.example.demo.surgery.Surgery;
import com.example.demo.surgery.SurgeryStatus;
import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class SurgeryDto {
    private Integer surgeryId;
    private Integer doctorId;
    private Integer patientId;
    private LocalDateTime startTime;
    private Integer durationHours;
    private String description;
    private SurgeryStatus status;
    private String name;

    public SurgeryDto(Surgery surgery) {
        surgeryId = surgery.getSurgeryId();
        doctorId = surgery.getDoctor().getStaffId();
        patientId = surgery.getPatient().getPatientId();
        startTime = surgery.getStartTime();
        description = surgery.getDescription();
        status = surgery.getStatus();
        durationHours = (surgery.getEndTime() != null && surgery.getStartTime() != null)
                ? (int) java.time.Duration.between(surgery.getStartTime(), surgery.getEndTime()).toHours()
                : null;
        name=surgery.getPatient().getName();
    }
}