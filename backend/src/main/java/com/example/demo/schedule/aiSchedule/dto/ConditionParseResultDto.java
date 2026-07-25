package com.example.demo.schedule.aiSchedule.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConditionParseResultDto {
    private List<AiManualConditionDto> manualConditionList;
    private List<String> warnings;
}