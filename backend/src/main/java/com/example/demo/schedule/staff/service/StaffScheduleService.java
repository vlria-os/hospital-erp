package com.example.demo.schedule.staff.service;

import com.example.demo.patient.Patient;
import com.example.demo.patient.PatientRepository;
import com.example.demo.reservation.Reservation;
import com.example.demo.reservation.ReservationRepository;
import com.example.demo.reservation.ReservationStatus;
import com.example.demo.reservation.dto.ReservationDto;
import com.example.demo.schedule.staff.dto.*;
import com.example.demo.schedule.staff.entity.StaffSchedule;
import com.example.demo.schedule.staff.entity.StaffScheduleType;
import com.example.demo.schedule.staff.repository.StaffScheduleRepository;
import com.example.demo.schedule.staff.repository.StaffScheduleTypeRepository;
import com.example.demo.staff.Staff;
import com.example.demo.staff.StaffRepository;
import com.example.demo.surgery.Surgery;
import com.example.demo.surgery.SurgeryRepository;
import com.example.demo.surgery.dto.SurgeryDto;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class StaffScheduleService {
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffScheduleTypeRepository staffScheduleTypeRepository;
    private final StaffRepository staffRepository;
    private final ReservationRepository reservationRepository;
    private final SurgeryRepository surgeryRepository;
    private final PatientRepository patientRepository;

    // 내 스케줄 조회 (JWT userId 기반)
    public Page<StaffScheduleDto> getMySchedule(Integer userId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Staff staff = staffRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 직원 정보가 없습니다."));
        return staffScheduleRepository.findAllWithFilter(staff.getStaffId(), startDate, endDate, pageable)
                .map(this::entityToDto);
    }

    public StaffScheduleDetailDto getMyDetail(Integer userId, LocalDate today){
        Staff staff = staffRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 직원 정보가 없습니다."));
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        List<Reservation> reservations = reservationRepository.findConfirmedByDoctorAndDate(staff.getStaffId(),
                ReservationStatus.CONFIRMED, start, end);
        List<Surgery> surgeries = surgeryRepository.findByDoctorAndDate(staff.getStaffId(), start, end);

        List<ReservationDto> reservationDtoList=new ArrayList<>();
        for(Reservation s:reservations){
            reservationDtoList.add(new ReservationDto(s));
        }
        List<SurgeryDto> surgeryDtoList=new ArrayList<>();
        for(Surgery s:surgeries){
            surgeryDtoList.add(new SurgeryDto(s));
        }

        StaffScheduleDetailDto staffScheduleDetailDto=new StaffScheduleDetailDto();
        staffScheduleDetailDto.setReservationDtoList(reservationDtoList);
        staffScheduleDetailDto.setSurgeryDtoList(surgeryDtoList);

        return staffScheduleDetailDto;
    }

    //스케줄 등록
    public Integer register(StaffScheduleDto dto){
        Staff staff=staffRepository.findById(dto.getStaffId())
                .orElseThrow(()->new EntityNotFoundException("존재하지 않는 직원입니다."));

        //의사 토요일/일요일 체크 추가
        validateDoctorDayRestriction(staff, dto.getWorkDate(), staffScheduleTypeRepository
                .findById(dto.getScheduleTypeId())
                .orElseThrow(()-> new EntityNotFoundException("존재하지 않는 근무 유형입니다")));

        if (Boolean.FALSE.equals(staff.getIsActive())){
            throw new IllegalStateException("비활성 직원은 스케줄을 배정할 수 없습니다");
        }

        StaffScheduleType staffScheduleType=staffScheduleTypeRepository.findById(dto.getScheduleTypeId())
                .orElseThrow(()->new EntityNotFoundException("존재하지 않는 근무유형입니다."));

        StaffScheduleType type = staffScheduleTypeRepository
                .findById(dto.getScheduleTypeId())
                .orElseThrow(()->new RuntimeException("근무유형 없음"));
        if (Boolean.FALSE.equals(staffScheduleType.getIsActive())){
            throw new RuntimeException("비활성 근무유형은 선택할 수 없습니다.");
        }

        boolean exists = staffScheduleRepository
                .existsByStaff_StaffIdAndWorkDate(dto.getStaffId(), dto.getWorkDate());

        if(exists) {
            throw new IllegalStateException("같은 직원의 같은 날짜 스케줄은 이미 존재합니다");
        }
        validateNightPattern(dto.getStaffId(), dto.getWorkDate(), null, staffScheduleType);

        StaffSchedule staffSchedule=dtoToEntity(dto, staff,staffScheduleType);

        return staffScheduleRepository.save(staffSchedule).getScheduleId();
    }
    private StaffSchedule dtoToEntity(StaffScheduleDto dto, Staff staff, StaffScheduleType staffScheduleType){
        return StaffSchedule.builder()
                .staff(staff)
                .workDate(dto.getWorkDate())
                .staffScheduleType(staffScheduleType)
                .status(dto.getStatus())
                .build();
    }
    private void validateDoctorDayRestriction(Staff staff, LocalDate workDate, StaffScheduleType type){
        if (staff.getUser() == null) return;
        boolean isDoctor = staff.getUser().getUserRoles().stream()
                .anyMatch(ur -> "DOCTOR".equalsIgnoreCase(ur.getRole().getRoleName()));
        if (!isDoctor) return;

        DayOfWeek day=workDate.getDayOfWeek();

        if(day == DayOfWeek.SUNDAY){
            throw new IllegalStateException("의사는 일요일 근무(진료) 등록이 불가입니다");
        }
        if(day == DayOfWeek.SATURDAY && !"SAT_MORNING".equalsIgnoreCase(type.getTypeCode())){
            throw new IllegalStateException("의사는 토요일 오전근무(SAT_MORNING)만 가능합니다");
        }
    }
    //전체조회 (페이징 + 직원/날짜 필터)
    public Page<StaffScheduleDto> selectAll(Integer staffId, LocalDate startDate, LocalDate endDate, Pageable pageable){
        return staffScheduleRepository.findAllWithFilter(staffId, startDate, endDate, pageable)
                .map(this::entityToDto);
    }
    private StaffScheduleDto entityToDto(StaffSchedule entity){
        return StaffScheduleDto.builder()
                .scheduleId(entity.getScheduleId())
                .staffId(entity.getStaff().getStaffId())
                .staffName(entity.getStaff().getName())
                .workDate(entity.getWorkDate())
                .scheduleTypeId(entity.getStaffScheduleType().getScheduleTypeId())
                .typeCode(entity.getStaffScheduleType().getTypeCode())
                .typeName(entity.getStaffScheduleType().getTypeName())
                .startTime(entity.getStaffScheduleType().getStartTime())
                .departmentId(entity.getStaff().getDepartment() != null ?
                        entity.getStaff().getDepartment().getDepartmentId() : null)
                .departmentName(entity.getStaff().getDepartment() != null ?
                        entity.getStaff().getDepartment().getDepartmentName() : null)
                .status(entity.getStatus())
                .build();
    }

    //조회
    public StaffScheduleDto selectOne(Integer scheduleId){
        StaffSchedule staffSchedule= staffScheduleRepository.findById(scheduleId)
                .orElseThrow(()->new EntityNotFoundException("해당 스케줄이 존재하지 않습니다"));
        return entityToDto(staffSchedule);
    }

    //수정
    public StaffScheduleDto update(Integer scheduleId, StaffScheduleDto dto){
        StaffSchedule staffSchedule=staffScheduleRepository.findById(scheduleId)
                .orElseThrow(()->new EntityNotFoundException("해당 스케줄이 존재하지 않습니다"));
        Staff staff= staffRepository.findById(dto.getStaffId())
                .orElseThrow(()->new EntityNotFoundException("해당 직원이 존재하지 않습니다"));

        if (Boolean.FALSE.equals(staff.getIsActive())){
            throw new IllegalStateException("비활성 직원은 스케줄을 배정할 수 없습니다");
        }

        StaffScheduleType staffScheduleType=staffScheduleTypeRepository.findById(dto.getScheduleTypeId())
                .orElseThrow(()->new EntityNotFoundException("해당 근무유형이 존재하지 않습니다"));

        if(staffSchedule.getStatus().equals("CONFIRMED")){
            throw new RuntimeException("확정된 스케줄은 수정할 수 없습니다");
        }
        boolean exists = staffScheduleRepository.existsByStaff_StaffIdAndWorkDate(
                dto.getStaffId(), dto.getWorkDate()
        );

        if (Boolean.FALSE.equals(staffScheduleType.getIsActive())){
            throw new RuntimeException("비활성 근무유형은 선택할 수 없습니다.");
        }

        if(exists && !staffSchedule.getStaff().getStaffId().equals(dto.getStaffId())
        || exists && !staffSchedule.getWorkDate().equals(dto.getWorkDate())){
            throw new IllegalStateException("같은 직원의 같은 날짜 스케줄은 이미 존재합니다");
        }

        validateNightPattern(dto.getStaffId(), dto.getWorkDate(), null, staffScheduleType);
        //의사 토요일/일요일 체크 추가
        validateDoctorDayRestriction(staff, dto.getWorkDate(), staffScheduleType);
        staffSchedule.setStaff(staff);
        staffSchedule.setWorkDate(dto.getWorkDate());
        staffSchedule.setStaffScheduleType(staffScheduleType);

        return entityToDto(staffSchedule);
    }

    //삭제
    public void delete(Integer scheduleId){
        StaffSchedule staffSchedule=staffScheduleRepository.findById(scheduleId)
                .orElseThrow(()-> new EntityNotFoundException("해당 스케줄이 존재하지 않습니다"));

        if(staffSchedule.getStatus().equals("CONFIRMED")){
            throw new RuntimeException("확정된 스케줄은 삭제할 수 없습니다");
        }

        staffScheduleRepository.delete(staffSchedule);
    }

    //스케줄상태변경
    public void confirm(Integer scheduleId) {
        StaffSchedule staffSchedule = staffScheduleRepository.findById(scheduleId)
                .orElseThrow(()->new EntityNotFoundException("해당 스케줄이 존재하지 않습니다"));
        staffSchedule.setStatus("CONFIRMED");
    }
    public void bulkConfirm(List<Integer> scheduleIds){
        List<StaffSchedule> schedules= staffScheduleRepository.findAllById(scheduleIds);
        for (StaffSchedule schedule: schedules){
            schedule.setStatus("CONFIRMED");
        }
    }

    //스케줄 일괄등록: 다른직원 같은스케줄 한번에

    private void validateNightPattern(Integer staffId, LocalDate workDate, Integer scheduleId,
                                       StaffScheduleType newType){
        LocalDate prevDate = workDate.minusDays(1);

        StaffSchedule prevSchedule;

        if(scheduleId==null){
            prevSchedule = staffScheduleRepository
                    .findByStaff_StaffIdAndWorkDate(staffId, prevDate)
                    .orElse(null);
        }else {
            prevSchedule = staffScheduleRepository
                    .findByStaff_StaffIdAndWorkDateAndScheduleIdNot(staffId, prevDate, scheduleId)
                    .orElse(null);
        }
        if(prevSchedule==null){
            return;
        }
        String prevTypeCode = prevSchedule.getStaffScheduleType().getTypeCode();
        String newTypeCode = newType.getTypeCode();

        if(prevTypeCode == null || newTypeCode == null){
            return;
        }
        //전날 나이트근무이면 다음날 데이,이브닝,나이트 금지
        if("NIGHT".equalsIgnoreCase(prevTypeCode)){
            if ("DAY".equalsIgnoreCase(newTypeCode)
            || "EVENING".equalsIgnoreCase(newTypeCode)
            || "NIGHT".equalsIgnoreCase(newTypeCode)){
                throw new IllegalStateException("야간근무 다음날에는 데이/이브닝/야간근무를 배정할 수 없습니다");
            }
        }
    }
}
