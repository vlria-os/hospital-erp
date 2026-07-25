package com.example.demo.slot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class SlotDayResponse {
    private String date;           // 2026-04-01
    private int totalCapacity;     // 남은 총 인원
    private boolean available;     // 하나라도 가능하면 true
    private String scheduleType;   // 스케줄 타입명 (OFF, 주간 등), null이면 가예약

}
