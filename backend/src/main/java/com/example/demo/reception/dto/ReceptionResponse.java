package com.example.demo.reception.dto;

import com.example.demo.reception.Reception;
import com.example.demo.reception.ReceptionStatus;
import com.example.demo.reservation.Reservation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReceptionResponse {
    private Integer reservationId;
    private Integer receptionId;
    private Integer patientId;
    private String patientName;
    private Integer doctorId;
    private String doctorName;
    private Integer departmentId;
    private String departmentName;
    private LocalDateTime reservationDate;
    private ReceptionStatus status;
    private String symptom;

    public ReceptionResponse(Reception reception) {
        this.reservationId = reception.getReservation().getReservationId();
        this.receptionId=reception.getReceptionId();
        this.patientId=reception.getReservation().getPatient().getPatientId();
        this.patientName = reception.getReservation().getPatient().getName();
        this.doctorId=reception.getReservation().getStaff().getStaffId();
        this.doctorName = reception.getReservation().getStaff().getName();
        this.departmentId=reception.getReservation().getDepartment().getDepartmentId();
        this.departmentName=reception.getReservation().getDepartment().getDepartmentName();
        this.reservationDate = reception.getReservation().getSlot().getStartTime();
        this.status=reception.getStatus();
        this.symptom=reception.getReservation().getSymptom();
    }
}
