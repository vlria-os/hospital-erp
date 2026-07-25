package com.example.demo.billing;
import com.example.demo.reception.Reception;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillingRepository extends JpaRepository<Billing, Integer> {
    Page<Billing> findByReception_ReceptionId(Integer receptionId, Pageable pageable);
    Page<Billing> findByReception_Reservation_Patient_NameContaining(String keyword, Pageable pageable);
    Optional<Billing> findByBillingId(Integer billingId);
}
