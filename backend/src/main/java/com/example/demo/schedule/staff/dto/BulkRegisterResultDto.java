package com.example.demo.schedule.staff.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkRegisterResultDto {
    private int savedCount;
    private int skippedCount;
    private List<SkippedScheduleDto> skippedList;
    private String message;
}
