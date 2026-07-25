package com.example.demo.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class CashPaymentDto {
    private Integer billingId;
    private Integer amount;
}
