package com.example.demo.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UploadAttachmentResponse {
    private String originalFileName;
    private String storedFileName;
    private String contentType;
    private String fileExtension;
    private Long fileSize;
}
