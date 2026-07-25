package com.example.demo.schedule.staff.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkStaffScheduleDto {
    private List<Integer> staffIds;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer scheduleTypeId;
    private String status;
}
