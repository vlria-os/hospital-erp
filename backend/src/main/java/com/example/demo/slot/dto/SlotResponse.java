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
public class SlotResponse {
    private Integer slotId;
    private Integer doctorId;
    private LocalDateTime startTime;
    private Integer capacity;
    private Boolean available;
    private SlotStatus type;

    public SlotResponse(Slot slot){
        this.slotId=slot.getSlotId();
        this.doctorId=slot.getStaff().getStaffId();
        this.startTime=slot.getStartTime();
        this.capacity=slot.getMaxPatient()-slot.getCurrentPatient();
        this.available=true;
        this.type=slot.getType();
    }
}
