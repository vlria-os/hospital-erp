package com.example.demo.reservation.service;

import com.example.demo.reservation.ReservationRepository;
import com.example.demo.schedule.staff.entity.StaffSchedule;
import com.example.demo.schedule.staff.entity.StaffScheduleType;
import com.example.demo.schedule.staff.repository.StaffScheduleRepository;
import com.example.demo.slot.Slot;
import com.example.demo.slot.SlotRepository;
import com.example.demo.surgery.SurgeryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Transactional
public class AvailabilityService {
    private final StaffScheduleRepository staffScheduleRepository;
    private final SlotRepository slotRepository;

    //검진가능한 슬롯인지
    public Boolean isCheckedSlotAvailable(Integer slotId){
        Slot slot=slotRepository.findById(slotId)
                .orElseThrow(()->new IllegalStateException("슬롯이 존재하지 않습니다"));
        if (slot.getStaff()==null || slot.getStaff().getStaffId()==null){
            return false;
        }
        if (slot.getCurrentPatient()==null || slot.getMaxPatient() ==null){
            return false;
        }
        if (slot.getCurrentPatient() >= slot.getMaxPatient()){
            return false;
        }
        return isStaffAvailableForSlot(slot);
    }
    public Boolean isStaffAvailable(Integer staffId, LocalDate workDate, LocalTime requestStart, LocalTime requestEnd){
        validateTime(requestStart, requestEnd);

        StaffSchedule staffSchedule= staffScheduleRepository.findByStaff_StaffIdAndWorkDate(staffId,workDate)
                .orElse(null);

        if(staffSchedule == null){
            return false;
        }

        if(staffSchedule.getStatus()==null){
            return false;
        }
        StaffScheduleType scheduleType = staffSchedule.getStaffScheduleType();
        if (scheduleType == null){
            return false;
        }

        if(scheduleType.getStartTime()==null || scheduleType.getEndTime()==null){
            return false;
        }
        if(Boolean.FALSE.equals(scheduleType.getIsActive())){
            return false;
        }
        return isWithinWorkTime(
                scheduleType.getStartTime(),
                scheduleType.getEndTime(),
                requestStart,
                requestEnd
        );
    }

    private boolean isStaffAvailableForSlot(Slot slot){
        Integer staffId= slot.getStaff().getStaffId();
        LocalDateTime startDateTime=slot.getStartTime();

        if (startDateTime == null){
            return false;
        }
        LocalDate workDate = startDateTime.toLocalDate();
        LocalTime requestStart = startDateTime.toLocalTime();
        LocalTime requestEnd = requestStart.plusHours(1);

        return isStaffAvailable(staffId, workDate, requestStart, requestEnd);
    }

    private void validateTime(LocalTime startTime, LocalTime endTime){
        if(startTime == null || endTime == null){
            throw new IllegalStateException("시작시간과 종료시간은 필수입니다");
        }
        if(!startTime.isBefore(endTime)){
            throw new IllegalStateException("종료시간은 시작시간보다 뒤여야합니다");
        }
    }

    private boolean isWithinWorkTime(LocalTime workStart,
                                  LocalTime workEnd,
                                  LocalTime requestStart,
                                  LocalTime requestEnd){
        if(!workEnd.isBefore(workStart)){
            return !requestStart.isBefore(workStart) && !requestEnd.isAfter(workEnd);
        }
        boolean requestStartValid = !requestStart.isBefore(workStart) || !requestStart.isAfter(workEnd);
        boolean requestEndValid = !requestEnd.isBefore(workStart) || !requestEnd.isAfter(workEnd);

       return requestStartValid && requestEndValid;
    }

}
