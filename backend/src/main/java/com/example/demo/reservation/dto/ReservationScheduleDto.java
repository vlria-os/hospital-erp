package com.example.demo.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReservationScheduleDto {
    private Integer doctorId;
    private String doctorName;
    private LocalDateTime start;
    private LocalDateTime end;
    private Integer capacity;
}
