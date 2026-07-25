package com.example.demo.aiDiagnosis;

import com.example.demo.medicalRecord.MedicalRecord;
import com.example.demo.medicalRecord.MedicalRecordRepository;
import com.example.demo.medicalRecord.MedicalRecordStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@RequiredArgsConstructor
@Service
@Transactional
public class AiDiagnosisService {
    private final MedicalRecordRepository medicalRecordRepository;

    public List<Map<String, Object>> getDiagnosisSets(Integer patientId,
                                                      Integer departmentId) {

        List<MedicalRecord> diagnosisList =
                medicalRecordRepository
                        .findTop4ByPatient_PatientIdAndStaff_Department_DepartmentIdAndMedicalRecordStatusOrderByCreateAtDesc(
                                patientId,
                                departmentId,
                                MedicalRecordStatus.DIAGNOSIS
                        );

        if (diagnosisList.isEmpty()) return new ArrayList<>();

        // 🔥 2. 시간순 정렬
        diagnosisList = diagnosisList.stream()
                .sorted(Comparator.comparing(MedicalRecord::getCreateAt))
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();

        // 🔥 3. 세트 구성
        for (int i = 0; i < diagnosisList.size(); i++) {

            MedicalRecord diag = diagnosisList.get(i);

            LocalDateTime start = diag.getCreateAt();
            LocalDateTime end = (i == diagnosisList.size() - 1)
                    ? LocalDateTime.now()
                    : diagnosisList.get(i + 1).getCreateAt();

            List<MedicalRecord> records =
                    medicalRecordRepository
                            .findByPatient_PatientIdAndCreateAtGreaterThanEqualAndCreateAtLessThanAndStaff_Department_DepartmentIdOrderByCreateAtAsc(
                                    patientId, start, end, departmentId
                            );

            Map<String, Object> set = new HashMap<>();

            // 👉 diagnosis (여기에 symptom 포함됨!)
            Map<String, Object> diagnosis = new HashMap<>();
            diagnosis.put("date", diag.getCreateAt());
            diagnosis.put("symptom", diag.getSymptom());
            diagnosis.put("content", diag.getContent());
            diagnosis.put("diseaseCode", diag.getDiseaseCode());

            set.put("diagnosis", diagnosis);

            List<Map<String, Object>> recordList = new ArrayList<>();

            for (MedicalRecord r : records) {

                if (r.getMedicalRecordStatus() != MedicalRecordStatus.DIAGNOSIS) {

                    Map<String, Object> map = new HashMap<>();
                    map.put("type", r.getMedicalRecordStatus().name());
                    map.put("content", r.getContent());
                    map.put("date", r.getCreateAt());

                    recordList.add(map);
                }
            }

            set.put("records", recordList);

            result.add(set);
        }

        return result;
    }
}
