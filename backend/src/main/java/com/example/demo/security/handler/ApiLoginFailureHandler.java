package com.example.demo.security.handler;

import com.example.demo.socialAccount.SocialAccountException;
import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

@Component
public class ApiLoginFailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        Gson gson=new Gson();
        Map<String, Object> result=new HashMap<>();

        Throwable cause=exception.getCause();

        if (exception instanceof SocialAccountException e){
            result.put("error", "SOCIAL_LOGIN_ONLY");
            result.put("providers", e.getProviders());
            result.put("message", "소셜 로그인 전용 계정입니다.");
        } else if (cause instanceof SocialAccountException e) {
            result.put("error", "SOCIAL_LOGIN_ONLY");
            result.put("providers", e.getProviders());
            result.put("message", "소셜 로그인 전용 계정입니다.");
        } else {
            result.put("error", "ERROR_LOGIN");
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=utf-8");

        PrintWriter out=response.getWriter();
        out.println(gson.toJson(result));
        out.close();
    }
}
