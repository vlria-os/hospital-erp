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
public class ChatAttachmentSummaryDto {
    private Integer roomId;
    private Integer userId;
    private String username;
    private Integer messageId;
    private Integer attachmentId;
    private String originalFileName;
    private String storedFileName;
    private String fileUrl;
    private String contentType;
    private String fileExtension;
    private Long fileSize;
    private LocalDateTime createdAt;
}
