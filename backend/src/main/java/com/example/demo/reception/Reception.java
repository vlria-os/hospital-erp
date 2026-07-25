package com.example.demo.reception;

import com.example.demo.reservation.Reservation;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class Reception {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer receptionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservationId")
    private Reservation reservation;

    @Enumerated(EnumType.STRING)
    private ReceptionStatus status;

    @CreationTimestamp
    private LocalDateTime receptionTime;
}
