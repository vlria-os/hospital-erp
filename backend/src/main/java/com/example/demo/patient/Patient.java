package com.example.demo.patient;

import com.example.demo.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer patientId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", unique = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String rrn;

    @Column(nullable = false)
    private String name;

    private String phone;
    private String address;
    private String gender;
    private String bloodType;
    private Float height;
    private Float weight;
}
