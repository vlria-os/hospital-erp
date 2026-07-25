package com.example.demo.elasticSearch;

import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface MedicalRecordSearchRepository extends ElasticsearchRepository<MedicalRecordDocument, Integer> { }
