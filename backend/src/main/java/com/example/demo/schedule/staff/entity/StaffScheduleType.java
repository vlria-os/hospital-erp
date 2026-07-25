package com.example.demo.schedule.staff.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name="schedule_type")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffScheduleType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer scheduleTypeId;

    @Column(nullable = false, unique = true, length = 30)
    private String typeCode;

    @Column(nullable = false, length = 50)
    private String typeName;

    private LocalTime startTime;
    private LocalTime endTime;

    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}