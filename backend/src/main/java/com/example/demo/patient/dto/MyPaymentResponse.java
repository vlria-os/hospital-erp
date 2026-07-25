package com.example.demo.patient.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class MyPaymentResponse {
    private Integer billingId;
    private Integer paymentId;
    private Integer amount;
    private String method;
    private LocalDateTime paidAt;
}
