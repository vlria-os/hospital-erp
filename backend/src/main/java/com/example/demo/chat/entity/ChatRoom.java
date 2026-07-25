package com.example.demo.chat.entity;

import com.example.demo.chat.ChatRoomType;
import com.example.demo.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roomId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ChatRoomType roomType;

    private String roomName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User user;

    private Integer lastMessageId;
    private LocalDateTime lastMessageAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
