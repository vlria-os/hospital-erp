package com.example.demo.staff.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StaffBulkUploadResponseDto {
    private int successCount;
    private int failCount;
    private List<FailDetail> failDetails;

    @Getter
    @Setter
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class FailDetail{
        private int row;
        private String userId;
        private String name;
        private String reason;
    }
}

