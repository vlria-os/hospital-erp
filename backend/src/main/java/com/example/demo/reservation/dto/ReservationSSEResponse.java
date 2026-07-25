package com.example.demo.reservation.dto;

import com.example.demo.reservation.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReservationSSEResponse {
    private Integer reservationId;
    private Integer patientId;
    private String patientName;
    private LocalDateTime reservationDate;
}
