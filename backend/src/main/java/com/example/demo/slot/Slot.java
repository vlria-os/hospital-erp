package com.example.demo.slot;

import com.example.demo.department.Department;
import com.example.demo.staff.Staff;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class Slot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer slotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctorId")
    private Staff staff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departmentId")
    private Department department;

    private LocalDateTime startTime;
    private Integer maxPatient;
    private Integer currentPatient;

    @Enumerated(EnumType.STRING)
    private SlotStatus type;
}
