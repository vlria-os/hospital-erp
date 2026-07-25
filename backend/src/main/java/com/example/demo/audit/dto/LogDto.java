package com.example.demo.audit.dto;

import com.example.demo.audit.Log;
import com.example.demo.audit.LogStatus;
import com.example.demo.medicalRecord.MedicalRecord;
import com.example.demo.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class LogDto {
    private Long logId;
    private Integer userId;
    private Integer recordId;
    private LogStatus logStatus;
    private String reason;
    private LocalDateTime createdAt;

    public Log toEntity(User user, MedicalRecord medicalRecord){
        return Log.builder()
                .logId(logId)
                .user(user)
                .medicalRecord(medicalRecord)
                .reason(reason)
                .logStatus(logStatus)
                .createdAt(createdAt)
                .build();
    }
}
