package com.example.demo.chatbot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@Builder
@Data
@NoArgsConstructor
public class ChatbotDoctorScheduleResponse {
    private String department;
    private String doctorName;
    private String date;
    private String startDate;
    private String endDate;
    private boolean available;
    private List<ChatbotDoctorScheduleDto> schedules;
    private boolean schedulePublished;
}
