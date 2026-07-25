package com.example.demo.medicalRecord;

import com.example.demo.patient.Patient;
import com.example.demo.staff.Staff;
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
public class MedicalRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer recordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctorId")
    private Staff staff;

    private String symptom;
    private String diseaseCode;

    @Enumerated(EnumType.STRING)
    private MedicalRecordStatus medicalRecordStatus;
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private Boolean isSensitive;

    @CreationTimestamp
    private LocalDateTime createAt;
    private Boolean isFinal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisorId")
    private Staff supervisor;
}
