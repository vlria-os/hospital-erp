package com.example.demo.slot.dto;

import com.example.demo.slot.Slot;
import com.example.demo.slot.SlotStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class SlotDto {
    private Integer slotId;
    private Integer doctorId;
    private LocalDateTime startTime;
    private Integer maxPatient;
    private Integer currentPatient;
    private SlotStatus type;

    public SlotDto(Slot slot){
        this.slotId=slot.getSlotId();
        this.doctorId=slot.getStaff().getStaffId();
        this.startTime=slot.getStartTime();
        this.maxPatient=slot.getMaxPatient();
        this.currentPatient=slot.getCurrentPatient();
        this.type=slot.getType();
    }
}
