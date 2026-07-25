package com.example.demo.chatbot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@NoArgsConstructor
@Builder
public class ChatbotReservationResponse {
    private String department;
    private String date;
    private String startDate;
    private String endDate;
    private Integer totalCount;
    private Integer availableCount;
    private boolean schedulePublished;
}
