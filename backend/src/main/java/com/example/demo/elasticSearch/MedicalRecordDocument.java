package com.example.demo.elasticSearch;

import com.example.demo.medicalRecord.MedicalRecordStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(indexName="medical_record")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class MedicalRecordDocument {
    @Id
    private Integer id;
    private Integer patientId;

    @Field(type = FieldType.Text)
    private String title;

    @Field(type = FieldType.Text)
    private String symptom;

    private MedicalRecordStatus medicalRecordStatus;

    @Field(type = FieldType.Text)
    private String content;
}
