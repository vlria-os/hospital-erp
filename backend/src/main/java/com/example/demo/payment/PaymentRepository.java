package com.example.demo.payment;

import com.example.demo.billing.Billing;
import com.example.demo.reception.Reception;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByBilling(Billing billing);

    Page<Payment> findByBilling_Reception_ReceptionId(Integer receptionId, Pageable pageable);
    Page<Payment> findByBilling_Reception_Reservation_Patient_NameContaining(String keyword, Pageable pageable);

    Page<Payment> findByBilling_Reception(Reception reception, Pageable pageable);
}
