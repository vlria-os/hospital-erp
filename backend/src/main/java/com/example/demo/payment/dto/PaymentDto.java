package com.example.demo.payment.dto;

import com.example.demo.billing.Billing;
import com.example.demo.payment.PaymentMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class PaymentDto {
    private Integer paymentId;
    private Integer billingId;
    private Integer receptionId;
    private String patientName;
    private Integer amount;
    private String method;
    private LocalDateTime paymentDatetime;
}
