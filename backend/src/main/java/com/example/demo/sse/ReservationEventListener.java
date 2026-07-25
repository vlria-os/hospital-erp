package com.example.demo.sse;

import com.example.demo.security.redis.RedisService;
import com.example.demo.sse.redis.RedisPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ReservationEventListener {
    private final RedisPublisher redisPublisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleReservationConfirmed(ReservationConfirmedEvent event) {
        redisPublisher.publish(
                event.getDoctorId(),
                event.getData()
        );
    }
}
