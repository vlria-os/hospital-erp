package com.example.demo.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@Data
@NoArgsConstructor
@Builder
public class ChatAttachmentDto {
    private Integer attachmentId;
    private Integer messageId;
    private String originalFileName;
    private String storedFileName;
    private String fileUrl;
    private String contentType;
    private String fileExtension;
    private Long fileSize;
    private LocalDateTime createdAt;
}
