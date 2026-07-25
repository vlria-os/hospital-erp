package com.example.demo.chatbot.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReservationInquiryRequest {
    private String department;
    private String date;
    private String startDate;
    private String endDate;
}
