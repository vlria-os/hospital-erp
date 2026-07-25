package com.example.demo.schedule.staff.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkippedScheduleDto {
    private Integer staffId;
    private String staffName;
    private LocalDate workDate;
    private String reason;
}

