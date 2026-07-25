package com.example.demo.audit;

import com.example.demo.audit.dto.LogDto;
import com.example.demo.audit.dto.LogRequest;
import com.example.demo.medicalRecord.MedicalRecord;
import com.example.demo.medicalRecord.MedicalRecordRepository;
import com.example.demo.security.security.CustomUserDetails;
import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class LogService {
    private final LogRepository logRepository;
    private final UserRepository userRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public void saveLog(Integer recordId,
                        String reason,
                        CustomUserDetails customUserDetails){
        User user=userRepository.findByUserId(customUserDetails.getUserId())
                .orElseThrow(() -> new RuntimeException("Not exist"));
        MedicalRecord medicalRecord=medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Not exist"));

        LogDto logDto= LogDto.builder()
                .reason(reason)
                .logStatus(LogStatus.VIEW)
                .build();

        Log log=logDto.toEntity(user,medicalRecord);
        logRepository.save(log);
    }
}
