package com.example.demo.schedule.staff.dto;

import com.example.demo.reservation.dto.ReservationDto;
import com.example.demo.surgery.dto.SurgeryDto;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffScheduleDetailDto {
    List<ReservationDto> reservationDtoList;
    List<SurgeryDto> surgeryDtoList;
}
