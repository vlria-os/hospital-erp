package com.example.demo.security.jwtutil;

public class CustomJWTException extends RuntimeException{
    public CustomJWTException(String message){
        super(message);
    }
}
