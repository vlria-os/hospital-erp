package com.example.demo.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class PaymentPrepareDto {
    private Integer billingId;
    private String orderId;
    private String orderName;
    private Integer amount;
    private String customerName;
}
