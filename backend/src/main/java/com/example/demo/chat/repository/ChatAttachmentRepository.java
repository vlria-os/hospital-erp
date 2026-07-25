package com.example.demo.chat.repository;

import com.example.demo.chat.entity.ChatAttachment;
import com.example.demo.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatAttachmentRepository extends JpaRepository<ChatAttachment, Integer> {
    List<ChatAttachment> findByMessage_MessageId(Integer messageId);
    List<ChatAttachment> findByMessageIn(List<ChatMessage> messages);
    boolean existsByMessage(ChatMessage message);

    @Query("""
        select a 
        from ChatAttachment a
        join a.message m
        where m.room.roomId = :roomId
            and m.createdAt >= :joinedAt
        order by m.messageId desc, a.attachmentId desc
    """)
    Slice<ChatAttachment> findByRoomId(@Param("roomId") Integer roomId, @Param("joinedAt")LocalDateTime joinedAt,
                                       Pageable pageable);

    @Query("""
        select a 
        from ChatAttachment a
        join a.message m
        where m.room.roomId = :roomId
            and m.createdAt >= :joinedAt
                and m.messageId < :cursor
        order by m.messageId desc, a.attachmentId desc 
    """)
    Slice<ChatAttachment> findByRoomIdAndMessageIdLessThan(@Param("roomId") Integer roomId, @Param("joinedAt")LocalDateTime joinedAt,
                                       @Param("cursor") Integer cursor, Pageable pageable);
}
