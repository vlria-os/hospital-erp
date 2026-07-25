package com.example.demo.schedule.aiSchedule.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AiManualConditionDto {
    private Integer staffId;
    private String staffName;
    private String workDate;
    private String type;
    private String mode;
}
