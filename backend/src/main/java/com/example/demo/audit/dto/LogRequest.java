package com.example.demo.audit.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LogRequest {
    private Integer recordId;
    private String reason;
}
