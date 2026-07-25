package com.example.demo.reservation.dto;

import com.example.demo.department.Department;
import com.example.demo.patient.Patient;
import com.example.demo.reservation.Reservation;
import com.example.demo.reservation.ReservationStatus;
import com.example.demo.staff.Staff;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReservationDto {
    private Integer reservationId;
    private Integer patientId;
    private Integer doctorId;
    private LocalDateTime reservationDate;
    private String symptom;
    private Integer departmentId;
    private LocalDateTime preferredDate;
    private ReservationStatus status;
    private LocalDateTime createdAt;
    private String name;

    public ReservationDto(Reservation reservation){
        reservationId=reservation.getReservationId();
        patientId=reservation.getPatient().getPatientId();
        doctorId=reservation.getStaff().getStaffId();
        reservationDate=reservation.getSlot().getStartTime();
        status=reservation.getStatus();
        createdAt=reservation.getCreatedAt();
        name=reservation.getPatient().getName();
    }

    public Reservation toEntity(Patient patient, Staff staff){
        return Reservation.builder()
                .reservationId(reservationId)
                .patient(patient)
                .staff(staff)
                .status(status)
                .createdAt(createdAt)
                .build();
    }

    public Reservation toEntity(Patient patient, Department department){
        return Reservation.builder()
                .reservationId(reservationId)
                .patient(patient)
                .department(department)
                .status(status)
                .createdAt(createdAt)
                .build();
    }
}
