package com.example.demo.elasticSearch;

import com.example.demo.medicalRecord.MedicalRecord;
import com.example.demo.medicalRecord.MedicalRecordRepository;
import com.example.demo.medicalRecord.dto.MedicalRecordResponse;
import org.springframework.data.elasticsearch.core.query.Query;
import com.example.demo.elasticSearch.dto.SearchRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;


@RestController
@RequiredArgsConstructor
public class MedicalElasticController {
    private final MedicalRecordSearchRepository medicalRecordSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;
    private final MedicalRecordRepository medicalRecordRepository;

    @PostMapping("/api/elastic/search")
    public Page<MedicalRecordResponse> search(@RequestBody SearchRequest req) {
        Pageable pageable = PageRequest.of(req.getPage(), 3);

        Query query = NativeQuery.builder()
                .withQuery(q -> q
                        .bool(b -> b
                                .must(m -> m
                                        .term(t -> t
                                                .field("patientId")
                                                .value(req.getPatientId())
                                        )
                                )
                                .should(s -> s
                                        .match(m -> m
                                                .field("content")
                                                .query(req.getKeyword())
                                        )
                                )
                                .should(s -> s
                                        .match(m -> m
                                                .field("symptom")
                                                .query(req.getKeyword())
                                        )
                                )
                                .should(s -> s
                                        .match(m -> m
                                                .field("title")
                                                .query(req.getKeyword())
                                        )
                                )
                                .minimumShouldMatch("1")
                        )
                )
                .withPageable(pageable)
                .build();

        SearchHits<MedicalRecordDocument> result =
                elasticsearchOperations.search(query, MedicalRecordDocument.class);

        List<Integer> ids = result.stream()
                .map(hit -> hit.getContent().getId())
                .toList();

        List<MedicalRecord> records = medicalRecordRepository.findAllById(ids);
        List<MedicalRecordResponse> response = records.stream()
                .map(MedicalRecordResponse::new)
                .toList();

        return new PageImpl<>(response, pageable, result.getTotalHits());
    }
}
