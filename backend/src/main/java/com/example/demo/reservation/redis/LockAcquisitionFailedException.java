package com.example.demo.reservation.redis;

public class LockAcquisitionFailedException extends RuntimeException {
    public LockAcquisitionFailedException(String lockKey) {
        super("현재 처리 중인 요청이 있습니다. 잠시 후 다시 시도해주세요.");
    }
}
