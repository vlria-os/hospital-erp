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
public class MySocialAccount {
    private Integer socialAccountId;
    private String provider;
    private LocalDateTime createdAt;
}
