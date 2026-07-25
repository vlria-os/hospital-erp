package com.example.demo.reception;

import com.example.demo.billing.Billing;
import com.example.demo.billing.BillingRepository;
import com.example.demo.billing.BillingStatus;
import com.example.demo.patient.PatientRepository;
import com.example.demo.reception.dto.ReceptionDto;
import com.example.demo.reception.dto.ReceptionResponse;
import com.example.demo.reservation.Reservation;
import com.example.demo.reservation.ReservationRepository;
import com.example.demo.reservation.ReservationStatus;
import jakarta.persistence.criteria.CriteriaBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.ZoneId;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class ReceptionService {
    private final ReceptionRepository receptionRepository;
    private final ReservationRepository reservationRepository;
    private final PatientRepository patientRepository;
    private final BillingRepository billingRepository;

    public Integer receptionInsert(Reservation reservation){
        ReceptionDto receptionDto=ReceptionDto.builder()
                .reservationId(reservation.getReservationId())
                .status(ReceptionStatus.PENDING)
                .build();

        Reception reception=receptionRepository.save(receptionDto.toEntity(reservation));
        System.out.println("reception id = " + reception.getReceptionId());

        return reception.getReceptionId();
    }

    public Page<ReceptionResponse> receptionList(String name,
                                             Pageable pageable){
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));

        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return receptionRepository.findTodayReception(start, end, name, pageable)
                .map(ReceptionResponse::new);
    }

    public Page<ReceptionResponse> receptionStatusList(ReceptionStatus status,
                                                  String name,
                                                  Pageable pageable){
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));

        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return receptionRepository.findTodayReception(start, end, status, name, pageable)
                .map(ReceptionResponse::new);
    }

    public Map<String,Object> receptionReceived(Integer receptionId){
        Reception reception=receptionRepository.findById(receptionId)
                .orElseThrow(() -> new RuntimeException("Not exist"));

        Reservation reservation=reservationRepository.findById(reception.getReservation().getReservationId())
                .orElseThrow(() -> new RuntimeException("Not exist"));

        reservation.setStatus(ReservationStatus.COMPLETED);
        reception.setStatus(ReceptionStatus.RECEIVED);

        LocalDateTime now=LocalDateTime.now();
        if(reservation.getSlot().getStartTime().isAfter(now)) {
            now = reservation.getSlot().getStartTime();
        }

        reception.setReceptionTime(now);
        receptionRepository.save(reception);

        return Map.of("receptionId",receptionId);
    }

    public Integer receptionConsulting(Integer receptionId){
        Reception reception=receptionRepository.findById(receptionId)
                .orElseThrow(() -> new RuntimeException("Not exist"));

        reception.setStatus(ReceptionStatus.CONSULTING);

        return reception.getReceptionId();
    }

    public Integer receptionCompleted(Integer receptionId){
        Reception reception=receptionRepository.findById(receptionId)
                .orElseThrow(() -> new RuntimeException("Not exist"));

        reception.setStatus(ReceptionStatus.COMPLETED);

        billingRepository.save(Billing.builder()
                .reception(reception)
                .status(BillingStatus.PENDING).build());

        return reception.getReceptionId();
    }

    public Integer receptionCancel(Integer reservationId){
        Reservation reservation=reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Not exist"));
        Reception reception=receptionRepository.findByReservation(reservation);
        reception.setStatus(ReceptionStatus.CANCELED);

        return reception.getReceptionId();
    }
    public Integer receptionCancel(Reservation reservation){
        Reception reception=receptionRepository.findByReservation(reservation);
        reception.setStatus(ReceptionStatus.CANCELED);

        return reception.getReceptionId();
    }
}
