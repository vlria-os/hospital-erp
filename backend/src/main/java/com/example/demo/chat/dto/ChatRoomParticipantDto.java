package com.example.demo.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ChatRoomParticipantDto {
    private Integer participantId;
    private Integer roomId;
    private Integer userId;
    private String userName;
    private String customRoomName;
    private boolean isActive;
    private boolean me;
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
    private Integer lastReadMessageId;
    private LocalDateTime lastReadAt;
}
