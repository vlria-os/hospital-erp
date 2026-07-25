package com.example.demo.surgery.dto;

import com.example.demo.surgery.SurgeryStatus;
import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class SurgeryResponse {
    private Integer surgeryId;
    private Integer patientId;
    private String patientName;
    private Integer doctorId;
    private String doctorName;
    private SurgeryStatus status;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
}