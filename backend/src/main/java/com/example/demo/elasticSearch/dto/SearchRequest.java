package com.example.demo.elasticSearch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class SearchRequest {
    private Integer patientId;
    private String keyword;
    @Builder.Default
    private Integer page=0;
    private Integer searchSize;
}
