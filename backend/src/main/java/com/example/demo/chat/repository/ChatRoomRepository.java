package com.example.demo.chat.repository;

import com.example.demo.chat.ChatRoomType;
import com.example.demo.chat.entity.ChatRoom;
import com.example.demo.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Integer> {
    List<ChatRoom> findByRoomIdInOrderByLastMessageAtDesc(List<Integer> roomIds);
    Optional<ChatRoom> findByRoomId(Integer roomId);

    @Query("""
        select r
        from ChatRoom r
        where r.roomType = :roomType
        and exists (
            select 1
            from ChatRoomParticipant p1
            where p1.room = r
                and p1.user.userId = :myUserId
        )
        and exists (
            select 1
            from ChatRoomParticipant p2
            where p2.room = r
                and p2.user.userId = :otherUserId
        )
        and (
            select count(p3)
            from ChatRoomParticipant p3
            where p3.room = r
        ) = 2
    """)
    Optional<ChatRoom> findExistingDirectRoom(
            @Param("roomType") ChatRoomType roomType,
            @Param("myUserId") Integer myUserId,
            @Param("otherUserId") Integer otherUserId
    );
}
