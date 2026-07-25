package com.example.demo.socialAccount.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class KakaoLoginRequest {
    private String provider;
    private String providerId;
    private String name;
    private String rrn;
}
