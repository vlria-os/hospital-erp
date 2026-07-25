package com.example.demo.payment;

import com.example.demo.billing.Billing;
import com.example.demo.billing.BillingRepository;
import com.example.demo.billing.BillingStatus;
import com.example.demo.billing.dto.BillingDto;
import com.example.demo.department.Department;
import com.example.demo.department.DepartmentRepository;
import com.example.demo.payment.dto.CashPaymentDto;
import com.example.demo.payment.dto.PaymentConfirmDto;
import com.example.demo.payment.dto.PaymentDto;
import com.example.demo.payment.dto.PaymentPrepareDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {
    private final BillingRepository billingRepository;
    private final PaymentRepository paymentRepository;

    @Value("${tosspayments.secret-key}")
    private String secretKey;

    public Page<PaymentDto> getPaymentList(String keyword, Pageable pageable, List<String> roles){
        if (roles == null || roles.isEmpty() || !roles.contains("ADMIN")){
            throw new RuntimeException("접근 권한이 없습니다.");
        }

        Page<Payment> payments;

        if (keyword == null || keyword.trim().isEmpty()){
            payments=paymentRepository.findAll(pageable);
        } else {
            String trimmedKeyword=keyword.trim();

            if (trimmedKeyword.matches("\\d+")){
                payments=paymentRepository.findByBilling_Reception_ReceptionId(Integer.valueOf(trimmedKeyword), pageable);
            } else {
                payments=paymentRepository.findByBilling_Reception_Reservation_Patient_NameContaining(trimmedKeyword, pageable);
            }
        }

        return payments.map(p -> PaymentDto.builder()
                .paymentId(p.getPaymentId())
                .billingId(p.getBilling().getBillingId())
                .receptionId(p.getBilling().getReception().getReceptionId())
                .patientName(p.getBilling().getReception().getReservation().getPatient().getName())
                .amount(p.getAmount())
                .method(p.getMethod().name())
                .paymentDatetime(p.getPaymentDatetime()).build());
    }

    public void cashPayment(CashPaymentDto dto, List<String> roles){
        if (roles == null || roles.isEmpty() || !roles.contains("ADMIN")){
            throw new RuntimeException("접근 권한이 없습니다.");
        }

        if (dto.getAmount() == null || dto.getAmount() <= 0) {
            throw new RuntimeException("결제 금액이 올바르지 않습니다.");
        }

        if (dto.getBillingId() == null){
            throw new RuntimeException("청구서 번호가 존재하지 않습니다.");
        }

        Billing billing=billingRepository.findByBillingId(dto.getBillingId())
                .orElseThrow(()->new RuntimeException("청구서가 존재하지 않습니다."));

        if (billing.getStatus() != BillingStatus.PENDING && billing.getStatus() != BillingStatus.PARTIAL){
            throw new RuntimeException("결제 가능한 청구서가 아닙니다.");
        }

        int paidAmount=0;
        List<Payment> payments=paymentRepository.findByBilling(billing);
        for (Payment p:payments){
            paidAmount += p.getAmount();
        }

        int remainingAmount = billing.getTotalAmount() - paidAmount;

        if (remainingAmount <= 0) {
            throw new RuntimeException("이미 전액 결제된 청구서입니다.");
        }

        if (dto.getAmount() > remainingAmount) {
            throw new RuntimeException("남은 금액보다 많이 결제할 수 없습니다.");
        }

        Payment payment=Payment.builder()
                .billing(billing)
                .amount(dto.getAmount())
                .method(PaymentMethod.CASH)
                .paymentDatetime(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        int newPaidAmount=paidAmount + dto.getAmount();

        if (newPaidAmount < billing.getTotalAmount()){
            billing.setStatus(BillingStatus.PARTIAL);
        } else if (newPaidAmount == billing.getTotalAmount()) {
            billing.setStatus(BillingStatus.PAID);
        } else {
            throw new RuntimeException("결제 누적 금액이 청구 금액을 초과했습니다.");
        }
    }

    public void confirmPayment(PaymentConfirmDto dto, List<String> roles){
        if (roles == null || roles.isEmpty() || !roles.contains("ADMIN")){
            throw new RuntimeException("접근 권한이 없습니다.");
        }

        if (dto.getPaymentKey() == null || dto.getPaymentKey().isBlank()) {
            throw new RuntimeException("paymentKey가 없습니다.");
        }

        if (dto.getOrderId() == null || dto.getOrderId().isBlank()) {
            throw new RuntimeException("orderId가 없습니다.");
        }

        if (dto.getAmount() == null || dto.getAmount() <= 0) {
            throw new RuntimeException("결제 금액이 올바르지 않습니다.");
        }

        Integer billingId=extractBillingId(dto.getOrderId());

        Billing billing=billingRepository.findByBillingId(billingId)
                .orElseThrow(()->new RuntimeException("청구서가 존재하지 않습니다."));

        if (billing.getStatus() != BillingStatus.PENDING && billing.getStatus() != BillingStatus.PARTIAL){
            throw new RuntimeException("결제 가능한 청구서가 아닙니다.");
        }

        int paidAmount=0;
        List<Payment> payments=paymentRepository.findByBilling(billing);
        for (Payment p:payments){
            paidAmount += p.getAmount();
        }

        int remainingAmount = billing.getTotalAmount() - paidAmount;

        if (remainingAmount <= 0) {
            throw new RuntimeException("이미 전액 결제된 청구서입니다.");
        }

        if (dto.getAmount() > remainingAmount) {
            throw new RuntimeException("남은 금액보다 많이 결제할 수 없습니다.");
        }

        Map<String,Object> response=requestPaymentConfirm(dto);

        PaymentMethod method=convertMethod((String) response.get("method"));

        Payment payment=Payment.builder()
                .billing(billing)
                .amount(((Number) response.get("totalAmount")).intValue())
                .method(method)
                .paymentDatetime(LocalDateTime.now()).build();

        paymentRepository.save(payment);

        int newPaidAmount=paidAmount + dto.getAmount();

        if (newPaidAmount < billing.getTotalAmount()){
            billing.setStatus(BillingStatus.PARTIAL);
        } else if (newPaidAmount == billing.getTotalAmount()) {
            billing.setStatus(BillingStatus.PAID);
        } else {
            throw new RuntimeException("결제 누적 금액이 청구 금액을 초과했습니다.");
        }
    }

    private PaymentMethod convertMethod(String method){
        return switch (method) {
            case "카드", "CARD" -> PaymentMethod.CARD;
            case "간편결제", "EASY_PAY" -> PaymentMethod.EASY_PAY;
            case "가상계좌", "VIRTUAL_ACCOUNT" -> PaymentMethod.VIRTUAL_ACCOUNT;
            case "계좌이체", "TRANSFER" -> PaymentMethod.TRANSFER;
            case "휴대폰", "MOBILE_PHONE" -> PaymentMethod.MOBILE_PHONE;
            default -> throw new RuntimeException("지원하지 않는 결제 수단: " + method);
        };
    }

    private Integer extractBillingId(String orderId){
        try{
            String[] parts=orderId.split("_");
            return Integer.parseInt(parts[1]);
        } catch (Exception e) {
            throw new RuntimeException("orderId 형식이 올바르지 않습니다.");
        }
    }

    private Map<String, Object> requestPaymentConfirm(PaymentConfirmDto dto){
        String url = "https://api.tosspayments.com/v1/payments/confirm";

        String encodedKey= Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers=new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + encodedKey);

        Map<String, Object> body = new HashMap<>();
        body.put("paymentKey", dto.getPaymentKey());
        body.put("orderId", dto.getOrderId());
        body.put("amount", dto.getAmount());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        RestTemplate restTemplate=new RestTemplate();

        ResponseEntity<Map> response=restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null){
            throw new RuntimeException("결제 승인에 실패했습니다.");
        }

        return response.getBody();
    }

    public PaymentPrepareDto preparePayment(Integer billingId, Integer amount, List<String> roles){
        if (roles == null || roles.isEmpty() || !roles.contains("ADMIN")){
            throw new RuntimeException("접근 권한이 없습니다.");
        }

        if (amount == null || amount <= 0) {
            throw new RuntimeException("결제 금액이 올바르지 않습니다.");
        }

        Billing billing=billingRepository.findByBillingId(billingId)
                .orElseThrow(()->new RuntimeException("청구서가 존재하지 않습니다."));

        if (billing.getStatus() != BillingStatus.PENDING && billing.getStatus() != BillingStatus.PARTIAL){
            throw new RuntimeException("결제 가능한 청구서가 아닙니다.");
        }

        int paidAmount=0;
        List<Payment> payments=paymentRepository.findByBilling(billing);
        for (Payment p:payments){
            paidAmount += p.getAmount();
        }

        int remainingAmount=billing.getTotalAmount()-paidAmount;

        if (remainingAmount <= 0) {
            throw new RuntimeException("이미 전액 결제된 청구서입니다.");
        }

        if (amount > remainingAmount){
            throw new RuntimeException("남은 금액보다 많이 결제할 수 없습니다.");
        }

        String orderId="billing_" + billingId + "_" + UUID.randomUUID()
                .toString().replace("-","").substring(0, 16);

        String orderName="청구서 #" + billingId + " 결제";

        return PaymentPrepareDto.builder()
                .billingId(billingId)
                .orderId(orderId)
                .orderName(orderName)
                .amount(amount)
                .customerName(billing.getReception().getReservation().getPatient().getName()).build();
    }
}
