package com.example.demo.socialAccount.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class KakaoLoginResponse {
    private String provider;
    private String providerId;
}
