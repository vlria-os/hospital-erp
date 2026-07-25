package com.example.demo.schedule.aiSchedule.entity;

import com.example.demo.schedule.staff.entity.StaffScheduleType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentSchedulePolicyShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer policyShiftId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private DepartmentSchedulePolicy policy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_type_id", nullable = false)
    private StaffScheduleType scheduleType;

    private Integer minStaff;
    private Boolean isEnabled;

}

