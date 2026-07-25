package com.example.demo.notice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;
    private Integer userId;
    private String writer;
    private String title;
    private String content;
    @Builder.Default
    private int viewCount = 0;
    private boolean important;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
