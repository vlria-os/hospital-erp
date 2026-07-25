package com.example.demo.socialAccount.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class NaverLoginRequest {
    private String provider;
    private String providerId;
    private String rrn;
    private String name;
    private String gender;
    private String mobile;
}
