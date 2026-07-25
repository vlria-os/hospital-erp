package com.example.demo.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class CreateChatRoomRequest {
    private String roomType;
    private String roomName;
    private String customRoomName;
    private List<Integer> participantUserIds;
}
