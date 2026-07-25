package com.example.demo.schedule.aiSchedule.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
//DB에 저장된 부서별 기본 정책
public class DepartmentSchedulePolicyDto {
    private Integer policyId;
    private Integer departmentId;
    private String departmentName;
    private Integer roleId;
    private String jobType;

    private List<String> shiftTypes;
    //최소인원
    private Map<String, Integer> minStaffMap;
    //야간근무 연속제한
    private Integer maxConsecutiveNight;
    //야간근무 다음 데이, 이브닝 금지
    private Boolean blockNightToDay;
    private Boolean blockNightToEvening;
    //주 최대 근무일
    private Integer maxWorkDaysPerWeek;
    private Boolean isActive;
}
