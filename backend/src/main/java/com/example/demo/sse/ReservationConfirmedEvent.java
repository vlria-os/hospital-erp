package com.example.demo.sse;

import lombok.RequiredArgsConstructor;

public class ReservationConfirmedEvent {
    private final Integer doctorId;
    private final Object data;

    public ReservationConfirmedEvent(Integer doctorId, Object data) {
        this.doctorId = doctorId;
        this.data = data;
    }

    public Integer getDoctorId() {
        return doctorId;
    }

    public Object getData() {
        return data;
    }
}
