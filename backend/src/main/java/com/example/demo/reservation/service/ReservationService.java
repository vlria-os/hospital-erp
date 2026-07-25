package com.example.demo.reservation.service;

import com.example.demo.department.Department;
import com.example.demo.department.DepartmentRepository;
import com.example.demo.patient.Patient;
import com.example.demo.patient.PatientRepository;
import com.example.demo.reception.ReceptionService;
import com.example.demo.reservation.Reservation;
import com.example.demo.reservation.ReservationRepository;
import com.example.demo.reservation.ReservationStatus;
import com.example.demo.reservation.dto.ReservationDto;
import com.example.demo.reservation.dto.ReservationResponse;
import com.example.demo.reservation.dto.ReservationSSEResponse;
import com.example.demo.reservation.redis.DistributedLock;
import com.example.demo.slot.Slot;
import com.example.demo.slot.SlotRepository;
import com.example.demo.sse.ReservationConfirmedEvent;
import com.example.demo.staff.Staff;
import com.example.demo.staff.StaffRepository;
import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final ReceptionService receptionService;
    private final DepartmentRepository departmentRepository;
    private final SlotRepository slotRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AvailabilityService availabilityService;

    public Integer reservationReceived(ReservationDto reservationDto,
                                       Integer userId){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Not exist"));
        Patient patient = patientRepository.findByUser(user);
        Department department=departmentRepository.findByDepartmentId(reservationDto.getDepartmentId());

        Reservation reservation = reservationDto.toEntity(patient, department);
        reservation.setStatus(ReservationStatus.RECEIVED);
        reservation.setSymptom(reservationDto.getSymptom());

        if(reservationDto.getPreferredDate() != null){
            reservation.setPreferredDate(reservationDto.getPreferredDate());
        }

        if(reservationDto.getDoctorId()!=null){
            Staff staff=staffRepository.findByStaffId(reservationDto.getDoctorId());
            reservation.setStaff(staff);
        }

        reservationRepository.save(reservation);

        return reservation.getReservationId();
    }

    @DistributedLock(
            key = "#reservationDto.doctorId + ':' + #reservationDto.reservationDate"
    )
    public Integer reservationConfirmed(ReservationDto reservationDto){
        Reservation reservation=reservationRepository.findById(reservationDto.getReservationId())
                .orElseThrow(() -> new RuntimeException("Not exist"));

        Staff staff=staffRepository.findById(reservationDto.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Not exist"));

        Department department=departmentRepository.findByDepartmentId(staff.getDepartment().getDepartmentId());

        Slot slot=slotRepository.findByStartTimeAndStaff(reservationDto.getReservationDate(),staff)
                .orElseGet(() -> {
                    Slot newSlot=Slot.builder()
                            .currentPatient(0)
                            .maxPatient(3)
                            .startTime(reservationDto.getReservationDate())
                            .staff(staff)
                            .department(department)
                            .build();
                    slotRepository.save(newSlot);
                    return newSlot;
                });

        LocalDate workDate = reservationDto.getReservationDate().toLocalDate();
        LocalTime requestStart = reservationDto.getReservationDate().toLocalTime();
        LocalTime requestEnd = requestStart.plusHours(1);

        slot.setCurrentPatient(slot.getCurrentPatient()+1);

        reservation.setStaff(staff);
        reservation.setSlot(slot);
        reservation.setStatus(ReservationStatus.CONFIRMED);

        reservationRepository.save(reservation);
        int a=receptionService.receptionInsert(reservation);
        System.out.println("=====================>"+a);

        Integer userId=staff.getUser().getUserId();

         Patient patient=patientRepository.findById(reservationDto.getPatientId())
                 .orElseThrow(() -> new RuntimeException("Not exist"));
        ReservationSSEResponse reservationSSEResponse= ReservationSSEResponse.builder()
                .reservationId(reservationDto.getReservationId())
                .reservationDate(reservationDto.getReservationDate())
                .patientId(reservationDto.getPatientId())
                .patientName(patient.getName())
                .build();

        eventPublisher.publishEvent(
                new ReservationConfirmedEvent(
                        userId,
                        reservationSSEResponse
                )
        );

        return reservationDto.getReservationId();
    }

    @DistributedLock(
            key = "#reservationDto.doctorId + ':' + #reservationDto.reservationDate"
    )
    public Integer reservationPending(ReservationDto reservationDto){
        Reservation reservation=reservationRepository.findById(reservationDto.getReservationId())
                .orElseThrow(() -> new RuntimeException("Not exist"));

        Department department=departmentRepository.findByDepartmentId(reservationDto.getDepartmentId());
        List<Staff> doctors=staffRepository.findDoctorsByDepartment(department)
                .orElseThrow(() -> new RuntimeException("Not exist"));
        Integer maxPatient=doctors.size()*3;

        Slot slot=slotRepository.findByStartTime(reservationDto.getReservationDate())
                .orElseGet(() -> {
                    Slot newSlot=Slot.builder()
                            .currentPatient(0)
                            .maxPatient(maxPatient)
                            .startTime(reservationDto.getReservationDate())
                            .department(department)
                            .build();
                    slotRepository.save(newSlot);
                    return newSlot;
                });

        // 기존 슬롯의 maxPatient가 현재 의사 수와 다를 수 있으므로 갱신
        slot.setMaxPatient(maxPatient);

        if (slot.getCurrentPatient() >= slot.getMaxPatient()){
            throw new IllegalStateException("해당 슬롯은 마감되었습니다");
        }
        slot.setCurrentPatient(slot.getCurrentPatient()+1);

        reservation.setSlot(slot);
        reservation.setStatus(ReservationStatus.PENDING);

        reservationRepository.save(reservation);

        return reservationDto.getReservationId();
    }

    public Page<ReservationResponse> reservationList(String name,
                                                     Pageable pageable){
        return reservationRepository.findByStatusAndPatient_NameContainingOrderByCreatedAt(ReservationStatus.RECEIVED, name, pageable)
                .map(ReservationResponse::new);
    }

    public Page<ReservationResponse> reservationList(Integer departmentId,
                                                     String name,
                                                     Pageable pageable){
        Department department=departmentRepository.findByDepartmentId(departmentId);

        return reservationRepository.findByStatusAndDepartmentAndPatient_NameContaining(ReservationStatus.RECEIVED,
                                                                                        department,
                                                                                        name,
                                                                                        pageable)
                .map(ReservationResponse::new);
    }

    public Page<ReservationResponse> reservationPendingList(String name,
                                                            Pageable pageable){
        return reservationRepository.findByStatusAndPatient_NameContaining(ReservationStatus.PENDING, name, pageable)
                .map(ReservationResponse::new);
    }

    public Page<ReservationResponse> reservationPendingList(Integer departmentId,
                                                            String name,
                                                            Pageable pageable){
        Department department=departmentRepository.findByDepartmentId(departmentId);

        return reservationRepository.findByStatusAndDepartmentAndPatient_NameContaining(ReservationStatus.PENDING,
                                                                                        department,
                                                                                        name,
                                                                                        pageable)
                .map(ReservationResponse::new);
    }

    public Page<ReservationResponse> reservationConfirmedList(String name,
                                                              Pageable pageable){
        return reservationRepository.findByStatusAndPatient_NameContaining(ReservationStatus.CONFIRMED, name, pageable)
                .map(ReservationResponse::new);
    }

    public Page<ReservationResponse> reservationConfirmedList(Integer departmentId,
                                                              String name,
                                                              Pageable pageable){
        Department department=departmentRepository.findByDepartmentId(departmentId);

        return reservationRepository.findByStatusAndDepartmentAndPatient_NameContaining(ReservationStatus.CONFIRMED,
                                                                                        department,
                                                                                        name,
                                                                                        pageable)
                .map(ReservationResponse::new);
    }

    @DistributedLock(
            key = "#reservationId"
    )
    public Integer reservationCancel(Integer reservationId){
        Reservation reservation=reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Not exist"));

        if(reservation.getSlot()!=null){
            Slot slot=reservation.getSlot();
            slot.setCurrentPatient(slot.getCurrentPatient()-1);
        }

        if(reservation.getStatus()==ReservationStatus.CONFIRMED){
            receptionService.receptionCancel(reservation);
        }

        reservation.setStatus(ReservationStatus.CANCELED);

        return reservationId;
    }

    @DistributedLock(
            key = "#reservationDto.doctorId + ':' + #reservationDto.reservationDate"
    )
    public Integer reservationUpdate(ReservationDto reservationDto){
        Reservation reservation=reservationRepository.findById(reservationDto.getReservationId())
                .orElseThrow(() -> new RuntimeException("Not exist"));
        Staff staff=staffRepository.findByStaffId(reservationDto.getDoctorId());
        Department department=departmentRepository.findByDepartmentId(reservationDto.getDepartmentId());

        Slot slot=reservation.getSlot();
        slot.setCurrentPatient(slot.getCurrentPatient()-1);

        Slot slot1=slotRepository.findByStartTime(reservationDto.getReservationDate())
                .orElseGet(() -> {
                    Slot newSlot=Slot.builder()
                            .currentPatient(0)
                            .maxPatient(3)
                            .startTime(reservationDto.getReservationDate())
                            .department(department)
                            .staff(staff)
                            .build();
                    slotRepository.save(newSlot);
                    return newSlot;
                });

        reservation.setStaff(staff);
        reservation.setSlot(slot1);
        reservation.setDepartment(department);

        return reservation.getReservationId();
    }
}
