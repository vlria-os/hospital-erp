package com.example.demo.socialAccount.dto;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class NaverUserInfoResponse {
    private String resultCode;
    private String message;
    private NaverUserResponse response;

    @Getter
    @Setter
    public static class NaverUserResponse{
        private String id;
        private String name;
        private String gender;
        private String mobile;
        private String mobile_e164;
    }
}
