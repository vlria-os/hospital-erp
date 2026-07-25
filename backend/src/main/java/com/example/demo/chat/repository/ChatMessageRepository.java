package com.example.demo.chat.repository;

import com.example.demo.chat.entity.ChatMessage;
import com.example.demo.chat.entity.ChatRoom;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    Optional<ChatMessage> findByMessageId(Integer messageId);
    List<ChatMessage> findByMessageIdIn(List<Integer> messageIds);
    Slice<ChatMessage> findByRoom_RoomIdAndCreatedAtGreaterThanEqualOrderByMessageIdDesc(
            Integer roomId, LocalDateTime joinedAt, Pageable pageable);
    Slice<ChatMessage> findByRoom_RoomIdAndCreatedAtGreaterThanEqualAndMessageIdLessThanOrderByMessageIdDesc(
            Integer roomId, LocalDateTime joinedAt, Integer cursor, Pageable pageable);
    Integer countByRoom_RoomId(Integer roomId);
    Integer countByRoom_RoomIdAndMessageIdGreaterThan(Integer roomId, Integer messageId);
    void deleteByRoom(ChatRoom room);
}
