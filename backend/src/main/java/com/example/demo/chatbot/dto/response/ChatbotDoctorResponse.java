package com.example.demo.chatbot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ChatbotDoctorResponse {
    private String department;
    private List<ChatbotDoctorDto> doctors;
}
