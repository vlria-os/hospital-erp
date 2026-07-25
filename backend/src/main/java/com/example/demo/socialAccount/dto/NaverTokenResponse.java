package com.example.demo.socialAccount.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class NaverTokenResponse {
    private String access_token;
    private String refresh_token;
    private String expires_In;
    private String error;
    private String error_description;
}
