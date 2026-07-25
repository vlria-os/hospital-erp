package com.example.demo.audit;

import com.example.demo.security.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class MedicalRecordAspect {
    private final LogService logService;

    @Around("execution(* com.example.demo.medicalRecord.MedicalRecordService.medicalRecordDetail(..))")
    public Object logView(ProceedingJoinPoint joinPoint) throws Throwable{
        System.out.println("AOP 진입");
        Object[] args = joinPoint.getArgs();
        String reason=null;
        CustomUserDetails user = null;

        Integer recordId = (Integer) args[0];

        if(args.length>=3){
            reason = (String) args[1];
            user = (CustomUserDetails) args[2];
        }else{
            user = (CustomUserDetails) args[1];
        }

        logService.saveLog(recordId, reason, user);
        Object result=joinPoint.proceed();
        System.out.println("AOP 종료");

        return result;
    }
}
