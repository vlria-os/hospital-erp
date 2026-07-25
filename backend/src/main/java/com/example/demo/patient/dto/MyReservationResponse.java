package com.example.demo.patient.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class MyReservationResponse {
    private Integer reservationId;
    private Integer doctorId;
    private String doctorName;
    private Integer departmentId;
    private String departmentName;
    private String symptom;
    private String status;
    private LocalDateTime createdAt;
}
