package com.example.demo.patient.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class MyInfoResponse {
    private Integer userId;
    private Integer patientId;
    private String name;
    private String email;
    private String rrn;
    private String phone;
    private String address;

    private boolean isLocal;
    private boolean hasSocial;
    private boolean onlySocial;

    private List<MySocialAccount> socialAccounts;
}
