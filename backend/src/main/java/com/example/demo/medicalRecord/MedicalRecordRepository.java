package com.example.demo.medicalRecord;

import com.example.demo.patient.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord,Integer> {
    Page<MedicalRecord> findAllByPatientAndMedicalRecordStatusOrderByCreateAtDesc(Patient patient, MedicalRecordStatus medicalRecordStatus, Pageable pageable);

    List<MedicalRecord> findTop4ByPatient_PatientIdAndMedicalRecordStatusOrderByCreateAtDesc(Integer patientPatientId, MedicalRecordStatus medicalRecordStatus);

    List<MedicalRecord> findByPatient_PatientIdAndCreateAtBetween(Integer patientPatientId, LocalDateTime createAtAfter, LocalDateTime createAtBefore);

    List<MedicalRecord> findTop4ByPatient_PatientIdAndMedicalRecordStatusAndStaff_Department_DepartmentIdOrderByCreateAtDesc(Integer patientPatientId, MedicalRecordStatus medicalRecordStatus, Integer staffDepartmentDepartmentId);

    List<MedicalRecord> findByPatient_PatientIdAndCreateAtBetweenAndStaff_Department_DepartmentId(Integer patientPatientId, LocalDateTime createAtAfter, LocalDateTime createAtBefore, Integer staffDepartmentDepartmentId);

    List<MedicalRecord> findTop4ByPatient_PatientIdAndStaff_Department_DepartmentIdAndMedicalRecordStatusOrderByCreateAtDesc(Integer patientPatientId, Integer staffDepartmentDepartmentId, MedicalRecordStatus medicalRecordStatus);

    List<MedicalRecord> findByPatient_PatientIdAndCreateAtBetweenAndStaff_Department_DepartmentIdOrderByCreateAtAsc(Integer patientPatientId, LocalDateTime createAtAfter, LocalDateTime createAtBefore, Integer staffDepartmentDepartmentId);

    List<MedicalRecord> findByPatient_PatientIdAndCreateAtGreaterThanEqualAndCreateAtLessThanAndStaff_Department_DepartmentIdOrderByCreateAtAsc(Integer patientPatientId, LocalDateTime createAtIsGreaterThan, LocalDateTime createAtIsLessThan, Integer staffDepartmentDepartmentId);
}
