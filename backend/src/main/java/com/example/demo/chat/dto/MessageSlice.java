package com.example.demo.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class MessageSlice {
    private List<ChatMessageDto> messages;
    private boolean hasNext;
    private Integer nextCursor;
}
