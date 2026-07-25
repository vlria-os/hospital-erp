package com.example.demo.schedule.aiSchedule.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AiScheduleResultDto {
    //최종 스케줄 결과
    private List<Map<String, Object>> assignments;
    //조건에 맞는 근무 배정 실패
    private List<Map<String, Object>> unassigned;
    //경고문
    private List<String> warnings;
    //서버 검증 에러
    private List<String> validationErrors;
}
