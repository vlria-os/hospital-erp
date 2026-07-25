package com.example.demo.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UpdateMessageRequest {
    private Integer roomId;
    private Integer messageId;
    private String content;
    private Integer parentMessageId;
}
