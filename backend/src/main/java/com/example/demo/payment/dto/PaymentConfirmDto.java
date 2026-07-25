package com.example.demo.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class PaymentConfirmDto {
    private String paymentKey;
    private String orderId;
    private Integer amount;
}
