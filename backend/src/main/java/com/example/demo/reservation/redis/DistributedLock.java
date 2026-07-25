package com.example.demo.reservation.redis;

import java.lang.annotation.*;
import java.util.concurrent.TimeUnit;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DistributedLock {
    String key();                          // 락 키 (SpEL 표현식 사용 가능)
    TimeUnit timeUnit() default TimeUnit.SECONDS;
    long waitTime() default 3L;            // 락 획득 대기시간
    long leaseTime() default 5L;           // 락 자동 해제시간
}
