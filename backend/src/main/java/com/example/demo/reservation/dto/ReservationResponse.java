package com.example.demo.reservation.dto;

import com.example.demo.reception.Reception;
import com.example.demo.reservation.Reservation;
import com.example.demo.reservation.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReservationResponse {
    private Integer reservationId;

    private Integer patientId;
    private String patientName;
    private Integer doctorId;
    private String doctorName;
    private Integer departmentId;
    private String departmentName;

    private LocalDateTime reservationDate;
    private String symptom;
    private LocalDateTime preferredDate;
    private ReservationStatus status;
    private LocalDateTime createdAt;

    public ReservationResponse(Reservation reservation) {
        this.reservationId = reservation.getReservationId();

        this.patientId=reservation.getPatient().getPatientId();
        this.patientName = reservation.getPatient().getName();
        if (reservation.getStaff() != null) {
            this.doctorId = reservation.getStaff().getStaffId();
            this.doctorName = reservation.getStaff().getName();
        }

        if (reservation.getDepartment() != null) {
            this.departmentId = reservation.getDepartment().getDepartmentId();
            this.departmentName = reservation.getDepartment().getDepartmentName();
        }

        if (reservation.getSlot() != null) {
            this.reservationDate = reservation.getSlot().getStartTime();
        }

        this.symptom=reservation.getSymptom();
        if(reservation.getPreferredDate() != null){
            this.preferredDate=reservation.getPreferredDate();
        }

        this.status=reservation.getStatus();
        this.createdAt=reservation.getCreatedAt();
    }
}
