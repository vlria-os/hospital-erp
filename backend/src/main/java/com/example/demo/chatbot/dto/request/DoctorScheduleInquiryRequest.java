package com.example.demo.chatbot.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class DoctorScheduleInquiryRequest {
    private String department;
    private String doctorName;
    private String date;
    private String startDate;
    private String endDate;
}
