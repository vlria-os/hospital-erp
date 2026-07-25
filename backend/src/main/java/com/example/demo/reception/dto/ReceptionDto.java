package com.example.demo.reception.dto;

import com.example.demo.reception.Reception;
import com.example.demo.reception.ReceptionStatus;
import com.example.demo.reservation.Reservation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReceptionDto {
    private Integer receptionId;
    private Integer reservationId;
    private ReceptionStatus status;
    private LocalDateTime receptionTime;

    public ReceptionDto(Reception reception){
        receptionId=reception.getReceptionId();
        reservationId=reception.getReservation().getReservationId();
        status=reception.getStatus();
        receptionTime=reception.getReceptionTime();
    }

    public Reception toEntity(Reservation reservation){
        return Reception.builder()
                .reservation(reservation)
                .status(status)
                .receptionTime(receptionTime)
                .build();
    }
}
