package com.example.demo.billing.dto;

import com.example.demo.medicalRecord.MedicalRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class BillingDto {
    private Integer billingId;
    private Integer receptionId;
    private String patientName;
    private Integer totalAmount;
    private String status;
}
