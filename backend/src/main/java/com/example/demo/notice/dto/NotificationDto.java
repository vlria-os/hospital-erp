package com.example.demo.notice.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long notificationId;
    private Integer userId;
    private String writer;
    private String title;
    private String content;
    private int viewCount;
    private boolean important;
    private LocalDateTime createdAt;
}