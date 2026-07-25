package com.example.demo.chat.dto;

import com.example.demo.chat.entity.ChatAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ChatAttachmentSlice {
    private List<ChatAttachmentSummaryDto> attachments;
    private boolean hasNext;
    private Integer nextCursor;
}
