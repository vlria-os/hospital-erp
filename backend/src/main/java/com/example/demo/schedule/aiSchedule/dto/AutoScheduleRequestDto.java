package com.example.demo.schedule.aiSchedule.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
//프론트 -> 백 요청
public class AutoScheduleRequestDto {
    private Integer policyId;
    private LocalDate startDate;
    private LocalDate endDate;

    // 근무유형별 최소 인원 (ex: {"DAY": 2, "EVENING": 2, "NIGHT": 2})
    private Map<String, Integer> minStaffMap;
    // 야간 연속 근무 최대 일수
    private Integer maxConsecutiveNight;
    // 야간 다음날 데이 금지
    private Boolean blockNightToDay;
    // 야간 다음날 이브닝 금지
    private Boolean blockNightToEvening;
    // 주 최대 근무일
    private Integer maxWorkDaysPerWeek;

    // 추가 조건 (ex: "김행정 4/16 OFF")
    private String extraCondition;
}
