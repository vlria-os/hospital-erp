package com.example.demo.billing;

import com.example.demo.reception.Reception;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Billing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer billingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reception_id")
    private Reception reception;

    private Integer totalAmount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private BillingStatus status;
}
