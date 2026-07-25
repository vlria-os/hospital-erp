package com.example.demo.schedule.aiSchedule.entity;

import com.example.demo.department.Department;
import com.example.demo.role.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "department_schedule_policy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentSchedulePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer policyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = true)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    private Integer maxConsecutiveNight;
    private Boolean blockNightToDay;
    private Boolean blockNightToEvening;
    private Integer maxWorkDaysPerWeek;

    @Builder.Default
    private Boolean isActive = true;
}
