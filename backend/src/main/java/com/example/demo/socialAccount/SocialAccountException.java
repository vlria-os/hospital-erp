package com.example.demo.socialAccount;

import org.springframework.security.core.AuthenticationException;

import java.util.List;

public class SocialAccountException extends AuthenticationException {
    private final List<String> providers;

    public SocialAccountException(List<String> providers) {
        super("소셜 로그인 계정입니다.");
        this.providers=providers;
    }

    public List<String> getProviders() {
        return providers;
    }
}
