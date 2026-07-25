package com.example.demo.chat.dto;

import jakarta.persistence.criteria.CriteriaBuilder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ChatRoomDto {
    private Integer roomId;
    private String roomType;
    private String roomName;
    private Integer createdBy;
    private Integer lastMessageId;
    private String lastMessageText;
    private LocalDateTime lastMessageAt;
    private boolean lastMessageIsDeleted;
    private boolean lastMessageHasAttachment;
    private Long participantCount;
    private String customRoomName;
    private Integer unreadCount;
}
