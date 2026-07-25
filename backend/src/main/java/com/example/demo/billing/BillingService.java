package com.example.demo.billing;

import com.example.demo.billing.dto.BillingDto;
import com.example.demo.department.Department;
import com.example.demo.department.DepartmentRepository;
import com.example.demo.payment.dto.PaymentPrepareDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BillingService {
    private final BillingRepository billingRepository;

    public void insertTotalAmount(BillingDto dto, List<String> roles){
        if (roles == null || roles.isEmpty() || !roles.contains("ADMIN")){
            throw new RuntimeException("접근 권한이 없습니다.");
        }

        Billing billing=billingRepository.findByBillingId(dto.getBillingId())
                .orElseThrow(()->new RuntimeException("청구서가 존재하지 않습니다."));

        if (billing.getStatus() == BillingStatus.PAID || billing.getStatus() == BillingStatus.PARTIAL){
            throw new RuntimeException("결제 이력이 있어 총 금액을 수정할 수 없습니다.");
        }

        billing.setTotalAmount(dto.getTotalAmount());
    }

    public Page<BillingDto> getBillingList(String keyword, Pageable pageable, List<String> roles){
        if (roles == null || roles.isEmpty() || !roles.contains("ADMIN")){
            throw new RuntimeException("접근 권한이 없습니다.");
        }

        Page<Billing> billings;

        if (keyword == null || keyword.trim().isEmpty()){
            billings=billingRepository.findAll(pageable);
        } else {
            String trimmedKeyword=keyword.trim();

            if (trimmedKeyword.matches("\\d+")){
                billings=billingRepository.findByReception_ReceptionId(Integer.valueOf(trimmedKeyword), pageable);
            } else {
                billings=billingRepository.findByReception_Reservation_Patient_NameContaining(trimmedKeyword, pageable);
            }
        }

        return billings.map(b -> BillingDto.builder()
                .billingId(b.getBillingId())
                .receptionId(b.getReception().getReceptionId())
                .patientName(b.getReception().getReservation().getPatient().getName())
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus().name()).build());
    }
}
