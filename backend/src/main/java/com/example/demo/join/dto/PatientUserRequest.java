package com.example.demo.join.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class PatientUserRequest {
    private Integer patientId;
    private Integer userId;
    private Integer roleId;
    private String rrn;
    private String name;
    private String phone;
    private String address;
    private String gender;
    private String bloodType;
    private Float height;
    private Float weight;
    private String email;
    private String password;
    private LocalDateTime createdAt;
    private String status;
}
