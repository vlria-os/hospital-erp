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
public class ParentMessageDto {
    private Integer parentMessageId;
    private String parentMessageUserName;
    private String parentMessageContent;
    private boolean parentMessageIsDeleted;
    private List<ChatAttachmentDto> parentMessageAttachments;
}
