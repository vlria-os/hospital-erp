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
public class ChatRoomDetailResponse {
    private ChatRoomDto room;
    private List<ChatRoomParticipantDto> participants;
    public MessageSlice messages;
}
