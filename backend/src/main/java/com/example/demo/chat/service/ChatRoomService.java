package com.example.demo.chat.service;

import com.example.demo.chat.ChatMessageType;
import com.example.demo.chat.ChatRoomType;
import com.example.demo.chat.dto.*;
import com.example.demo.chat.entity.ChatMessage;
import com.example.demo.chat.entity.ChatRoom;
import com.example.demo.chat.entity.ChatRoomParticipant;
import com.example.demo.chat.repository.ChatAttachmentRepository;
import com.example.demo.chat.repository.ChatMessageRepository;
import com.example.demo.chat.repository.ChatRoomParticipantRepository;
import com.example.demo.chat.repository.ChatRoomRepository;
import com.example.demo.role.Role;
import com.example.demo.staff.Staff;
import com.example.demo.staff.StaffRepository;
import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import com.example.demo.userRole.UserRole;
import com.example.demo.userRole.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatRoomService {
    private final ChatRoomRepository roomRepository;
    private final ChatRoomParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository messageRepository;
    private final StaffRepository staffRepository;
    private final UserRoleRepository userRoleRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatAttachmentRepository attachmentRepository;

    public List<Integer> inviteStaff(Integer roomId, Integer inviter, List<Integer> staffIds){
        if (staffIds == null || staffIds.isEmpty()) {
            throw new RuntimeException("초대할 직원을 선택하세요.");
        }

        ChatRoom room=roomRepository.findByRoomId(roomId)
                .orElseThrow(()->new RuntimeException("채팅방이 존재하지 않습니다."));

        participantRepository.findByRoomAndUser_UserId(room, inviter)
                .orElseThrow(()->new RuntimeException("현재 참여 중인 사용자만 초대할 수 있습니다."));

        LocalDateTime now=LocalDateTime.now();
        List<Integer> result=new ArrayList<>();
        List<String> names=new ArrayList<>();
        for (Integer id:staffIds){
            Staff staff=staffRepository.findByUser_UserId(id)
                    .orElseThrow(()->new RuntimeException("존재하지 않는 직원입니다. (채팅방 초대 실패)"));

            boolean exists=participantRepository.existsByRoomAndUser_UserId(room, id);
            if (exists) continue;

            ChatRoomParticipant participant=participantRepository.save(ChatRoomParticipant.builder()
                    .room(room)
                    .user(staff.getUser())
                    .joinedAt(now)
                    .lastReadMessageId(room.getLastMessageId())
                    .lastReadAt(now).build());

            result.add(participant.getUser().getUserId());
            names.add(staff.getName());
        }

        if (!names.isEmpty()){
            ChatMessage systemMessage=inviteSystemMessage(room, inviter, names);

            room.setLastMessageId(systemMessage.getMessageId());
            room.setLastMessageAt(systemMessage.getCreatedAt());

            ChatMessageDto dto=ChatMessageDto.builder().roomId(roomId).messageId(systemMessage.getMessageId())
                    .content(systemMessage.getContent()).messageType(systemMessage.getMessageType().name())
                    .createdAt(systemMessage.getCreatedAt()).build();
            messagingTemplate.convertAndSend("/topic/chat.room." + roomId, dto);
        }

        if (!result.isEmpty()) {
            List<ChatRoomParticipant> finalParticipants = participantRepository.findByRoom(room);
            for (ChatRoomParticipant p : finalParticipants) {
                messagingTemplate.convertAndSend(
                        "/topic/chat.list." + p.getUser().getUserId(),
                        Map.of("type", "ROOM_LIST_REFRESH", "roomId", roomId)
                );
            }
        }

        return result;
    }

    private ChatMessage inviteSystemMessage(ChatRoom room, Integer inviter, List<String> names){
        Staff staff=staffRepository.findByUser_UserId(inviter)
                .orElseThrow(()->new RuntimeException("존재하지 않는 직원입니다. (채팅방 초대 메시지 생성 실패)"));

        String inviterName=staff.getName();
        String joinNames=names.stream().map(name -> name + "님").collect(Collectors.joining(", "));
        ChatMessage message=messageRepository.save(ChatMessage.builder()
                .room(room).messageType(ChatMessageType.SYSTEM)
                .content(inviterName + "님이 " + joinNames + "을 초대했습니다.").build());

        return message;
    }

    public LeaveChatRoomResponse leaveChatRoom(Integer roomId, Integer userId){
        ChatRoom room=roomRepository.findByRoomId(roomId)
                .orElseThrow(()->new RuntimeException("채팅방이 존재하지 않습니다."));

        ChatRoomParticipant participant=participantRepository.findByRoomAndUser_UserId(room, userId)
                .orElseThrow(()->new RuntimeException("현재 참여 중인 채팅방이 아닙니다."));

        Integer participantCount=participantRepository.countByRoom(room);
        if (participantCount == 1){
            participantRepository.deleteByRoom(room);
            participantRepository.flush();

            room.setLastMessageId(null);
            room.setLastMessageAt(null);
            roomRepository.saveAndFlush(room);

            messageRepository.deleteByRoom(room);
            messageRepository.flush();

            roomRepository.delete(room);
            roomRepository.flush();

            messagingTemplate.convertAndSend(
                    "/topic/chat.list." + userId,
                    Map.of("type", "ROOM_LIST_REFRESH")
            );

            return LeaveChatRoomResponse.builder().left(true).roomDelete(true).build();
        }

        ChatMessage systemMessage=leaveSystemMessage(room, userId);

        room.setLastMessageId(systemMessage.getMessageId());
        room.setLastMessageAt(systemMessage.getCreatedAt());

        ChatMessageDto dto=ChatMessageDto.builder().roomId(roomId).messageId(systemMessage.getMessageId())
                .content(systemMessage.getContent()).messageType(systemMessage.getMessageType().name())
                .createdAt(systemMessage.getCreatedAt()).build();
        messagingTemplate.convertAndSend("/topic/chat.room." + roomId, dto);

        participantRepository.delete(participant);

        Set<Integer> targetUserIds = new HashSet<>();
        targetUserIds.add(userId);

        List<ChatRoomParticipant> finalParticipants = participantRepository.findByRoom(room);
        for (ChatRoomParticipant p : finalParticipants) {
            targetUserIds.add(p.getUser().getUserId());
        }

        for (Integer targetUserId : targetUserIds) {
            messagingTemplate.convertAndSend(
                    "/topic/chat.list." + targetUserId,
                    Map.of("type", "ROOM_LIST_REFRESH", "roomId", roomId)
            );
        }

        return LeaveChatRoomResponse.builder().left(true).roomDelete(false).build();
    }

    private ChatMessage leaveSystemMessage(ChatRoom room, Integer userId){
        Staff staff=staffRepository.findByUser_UserId(userId)
                .orElseThrow(()->new RuntimeException("존재하지 않는 직원입니다. (채팅방 퇴장 메시지 생성 실패)"));
        ChatMessage message=messageRepository.save(ChatMessage.builder()
                .room(room)
                .messageType(ChatMessageType.SYSTEM)
                .content(staff.getName() + "님이 퇴장했습니다.").build());
        return message;
    }

    public List<GetStaffListResponse> getStaffListForInvite(Integer roomId, Integer userId){
        participantRepository.findByRoom_RoomIdAndUser_UserId(roomId, userId)
                .orElseThrow(()->new RuntimeException("현재 참여 중인 사용자만 직원 목록을 조회할 수 있습니다."));

        List<User> users=participantRepository.findByRoom_RoomId(roomId)
                .stream().map(m -> m.getUser()).toList();
        List<Staff> staffs=staffRepository.findByUserNotIn(users);

        //직원 역할 목록
        List<UserRole> userRoles=userRoleRepository.findByUserIn(staffs.stream().map(Staff::getUser).toList());

        List<GetStaffListResponse> responses=staffs.stream().map(u -> GetStaffListResponse.builder()
                .userId(u.getUser().getUserId())
                .username(u.getName())
                .department(pickDepartmentName(u, userRoles))
                .role(pickRoleName(userRoles, u.getUser())).build()).toList();

        return responses;
    }

    public List<GetStaffListResponse> getStaffList(Integer userId, String keyword){
        if (keyword == null || keyword.isBlank()) {
            keyword = null;
        } else if (keyword.trim().equals("간호") || keyword.trim().equals("간호부")){
            keyword = "NURSE";
        } else if (keyword.trim().equals("원무") || keyword.trim().equals("원무과")) {
            keyword = "ADMINISTRATION";
        }

        List<Staff> staffs=staffRepository.searchStaff(userId, keyword);

        //직원 역할 목록
        List<UserRole> userRoles=userRoleRepository.findByUserIn(staffs.stream().map(Staff::getUser).toList());

        List<GetStaffListResponse> responses=staffs.stream().map(u -> GetStaffListResponse.builder()
                .userId(u.getUser().getUserId())
                .username(u.getName())
                .department(pickDepartmentName(u, userRoles))
                .role(pickRoleName(userRoles, u.getUser())).build()).toList();

        return responses;
    }

    private String pickRoleName(List<UserRole> userRoles, User user){
        List<String> roles=userRoles.stream().filter(ur -> ur.getUser().equals(user))
                .map(ur -> ur.getRole().getRoleName()).toList();

        if (roles.contains("DOCTOR")){
            return roles.stream().filter(r -> !r.equals("DOCTOR"))
                    .findFirst()
                    .orElse("DOCTOR");
        } else if (roles.contains("ADMIN")) {
            return "ADMIN";
        } else {
            if (roles.contains("HEAD_NURSE")){
                return "HEAD_NURSE";
            }

            return "NURSE";
        }
    }

    private String pickDepartmentName(Staff staff, List<UserRole> userRoles) {
        if (staff.getDepartment() != null) {
            return staff.getDepartment().getDepartmentName();
        }

        List<String> roles = userRoles.stream()
                .filter(ur -> ur.getUser().equals(staff.getUser()))
                .map(ur -> ur.getRole().getRoleName())
                .toList();

        if (roles.contains("ADMIN")) return "원무과";
        else if (roles.contains("NURSE")) return "간호부";
        else return "알 수 없음";
    }

    public ChatRoomDto createChatRoom(Integer userId, CreateChatRoomRequest request){
        User user=userRepository.findByUserId(userId).orElseThrow(()->new RuntimeException("존재하지 않는 사용자입니다."));

        String roomName=null;

        String roomType=request.getRoomType();
        if (!"GROUP".equals(roomType) && !"DIRECT".equals(roomType)) {
            throw new RuntimeException("채팅방 타입이 올바르지 않습니다.");
        }

        List<Integer> participants=request.getParticipantUserIds();
        if (participants == null || participants.isEmpty()) {
            throw new RuntimeException("채팅방 참여자를 선택하세요.");
        }
        List<Integer> participantIds = participants.stream()
                .filter(id -> !id.equals(userId))
                .distinct()
                .toList();

        if ("DIRECT".equals(roomType) && participantIds.size() != 1) {
            throw new RuntimeException("1:1 채팅은 한 명만 선택할 수 있습니다.");
        }

        if ("GROUP".equals(roomType) && participantIds.size() < 2) {
            throw new RuntimeException("그룹 채팅 참여자를 두 명 이상 선택하세요.");
        }

        List<String> members=new ArrayList<>();
        ChatRoomType type;

        if ("GROUP".equals(roomType)){
            for (int i=0;i<participantIds.size();i++){
                Staff staff=staffRepository.findByUser_UserId(participantIds.get(i))
                        .orElseThrow(()->new RuntimeException("존재하지 않는 직원입니다."));
                members.add(staff.getName());
            }

            if (request.getRoomName() != null && !request.getRoomName().isBlank()) {
                roomName = request.getRoomName();
            } else {
                roomName = String.join("&", members);
            }
            type=ChatRoomType.GROUP;
        } else {
            ChatRoom existingRoom=roomRepository.findExistingDirectRoom(ChatRoomType.DIRECT, userId, participantIds.get(0))
                    .orElse(null);
            if (existingRoom != null){
                ChatRoomParticipant me = participantRepository.findByRoomAndUser_UserId(existingRoom, userId)
                        .orElseThrow(() -> new RuntimeException("채팅방 참가자가 존재하지 않습니다."));

                return ChatRoomDto.builder()
                        .roomId(existingRoom.getRoomId())
                        .roomType(existingRoom.getRoomType().name())
                        .roomName(existingRoom.getRoomName())
                        .createdBy(existingRoom.getUser().getUserId())
                        .customRoomName(me.getCustomRoomName())
                        .participantCount(2L).build();
            }

            Staff me=staffRepository.findByUser_UserId(userId)
                    .orElseThrow(()->new RuntimeException("존재하지 않는 직원입니다. (채팅방 생성자)"));
            Staff you=staffRepository.findByUser_UserId(participantIds.get(0))
                    .orElseThrow(()->new RuntimeException("존재하지 않는 직원입니다."));
            roomName=me.getName() + "&" + you.getName();
            type=ChatRoomType.DIRECT;
        }

        ChatRoom room=roomRepository.save(ChatRoom.builder()
                .roomType(type)
                .roomName(roomName)
                .user(user).build());

        Set<Integer> targetUserIds=new HashSet<>();

        ChatRoomParticipant master=participantRepository.save(
                ChatRoomParticipant.builder()
                        .room(room)
                        .user(user)
                        .customRoomName(request.getCustomRoomName() != null && !request.getCustomRoomName().isBlank()
                                ? request.getCustomRoomName() : null).build()
        );

        targetUserIds.add(master.getUser().getUserId());

        for (int i=0; i<participantIds.size();i++){
            User participant=userRepository.findByUserId(participantIds.get(i))
                    .orElseThrow(()-> new RuntimeException("존재하지 않는 사용자입니다. (채팅방 참여자)"));
            ChatRoomParticipant p=participantRepository.save(ChatRoomParticipant.builder()
                    .room(room)
                    .user(participant).build());
            targetUserIds.add(p.getUser().getUserId());
        }

        for (Integer id:targetUserIds){
            messagingTemplate.convertAndSend(
                    "/topic/chat.list." + id,
                    Map.of("type", "ROOM_LIST_REFRESH")
            );
        }

        Long participantCount= 1L + participantIds.size();

        return ChatRoomDto.builder()
                .roomId(room.getRoomId())
                .roomType(room.getRoomType().name())
                .roomName(room.getRoomName())
                .createdBy(room.getUser().getUserId())
                .customRoomName(master.getCustomRoomName())
                .participantCount(participantCount).build();
    }

    public void markAsRead(Integer roomId, Integer userId){
        ChatRoomParticipant participant=participantRepository
                .findByRoom_RoomIdAndUser_UserId(roomId, userId)
                .orElseThrow(()->new RuntimeException("채팅방 참여자 정보가 없습니다."));

        ChatRoom room=roomRepository.findByRoomId(roomId)
                .orElseThrow(()->new RuntimeException("채팅방이 존재하지 않습니다."));

        Integer lastMessageId=room.getLastMessageId();
        if (lastMessageId == null){
            return;
        }

        if (participant.getLastReadMessageId() == null ||
                participant.getLastReadMessageId() < lastMessageId) {

            participant.setLastReadMessageId(lastMessageId);
            participant.setLastReadAt(LocalDateTime.now());

            ReadStatusDto readStatus=ReadStatusDto.builder()
                    .roomId(roomId).userId(userId).lastReadMessageId(lastMessageId).build();

            messagingTemplate.convertAndSend(
                    "/topic/chat.room." + roomId + ".read", readStatus
            );
        }
    }

    public List<ChatRoomParticipantDto> getParticipantInfo(Integer roomId, Integer userId){
        List<ChatRoomParticipant> participants=participantRepository.findByRoom_RoomId(roomId);

        //참가자 이름 구하기
        List<User> users=participants.stream().map(p -> p.getUser()).toList();
        List<Staff> staff=staffRepository.findByUserIn(users);
        Map<Integer, String> names=staff.stream().collect(Collectors.toMap(
                s -> s.getUser().getUserId(),
                s -> s.getName()
        ));

        List<ChatRoomParticipantDto> list=participants.stream()
                .map(p -> ChatRoomParticipantDto.builder()
                        .participantId(p.getParticipantId())
                        .roomId(p.getRoom().getRoomId())
                        .userId(p.getUser().getUserId())
                        .userName(names.getOrDefault(p.getUser().getUserId(), null))
                        .customRoomName(p.getCustomRoomName())
                        .me(p.getUser().getUserId().equals(userId))
                        .joinedAt(p.getJoinedAt())
                        .lastReadMessageId(p.getLastReadMessageId())
                        .lastReadAt(p.getLastReadAt()).build()).toList();
        return list;
    }

    public ChatRoomDto getChatRoom(Integer roomId, Integer userId){
        ChatRoom chatRoom=roomRepository.findByRoomId(roomId).orElseThrow(()->new RuntimeException("존재하지 않는 채팅방입니다."));

        List<ChatRoomParticipant> participants=participantRepository.findByRoom(chatRoom);
        ChatRoomParticipant userCustomRoom=participantRepository.findByRoomAndUser_UserId(chatRoom, userId)
                .orElseThrow(()-> new RuntimeException("채팅방 혹은 유저 정보가 존재하지 않습니다."));

        return ChatRoomDto.builder()
                .roomId(chatRoom.getRoomId())
                .roomType(chatRoom.getRoomType().name())
                .roomName(chatRoom.getRoomName())
                .createdBy(chatRoom.getUser().getUserId())
                .participantCount(Long.valueOf(participants.size()))
                .customRoomName(userCustomRoom.getCustomRoomName()).build();
    }

    public List<ChatRoomDto> chatRoomList(Integer userId){
        User user=userRepository.findByUserId(userId).orElseThrow(()->new RuntimeException("사용자를 찾을 수 없습니다."));
        List<ChatRoomParticipant> participants=participantRepository.findByUser(user);
        if (participants.isEmpty()){
            return List.of();
        }

        Map<Integer, ChatRoomParticipant> myParticipantMap=participants.stream()
                .collect(Collectors.toMap(
                        p -> p.getRoom().getRoomId(),
                        p -> p
                ));

        List<ChatRoom> chatRooms = roomRepository.findByRoomIdInOrderByLastMessageAtDesc(
                participants.stream().map(p -> p.getRoom().getRoomId()).toList()
        );

        List<ChatRoomParticipant> countList=participantRepository.findByRoomIn(chatRooms);

        Map<Integer, Long> counts=countList.stream().collect(Collectors.groupingBy(
                p -> p.getRoom().getRoomId(),
                Collectors.counting()
        ));

        Map<Integer, String> customRoomNames=participants.stream().filter(p -> p.getCustomRoomName() != null)
                .collect(Collectors.toMap(
                        p -> p.getRoom().getRoomId(),
                        p -> p.getCustomRoomName()
                ));

        List<Integer> messageIds=chatRooms.stream().map(m -> m.getLastMessageId())
                .filter(id -> id != null).toList();
        List<ChatMessage> messages=messageRepository.findByMessageIdIn(messageIds);
        Map<Integer, ChatMessage> lastMessagesMap=messages.stream().collect(Collectors.toMap(
           m -> m.getMessageId(),
           m -> m
        ));

        Map<Integer, Object> lastMessageIsDeleted=messages.stream().collect(Collectors.toMap(
                m -> m.getMessageId(),
                m -> m.isDeleted()
        ));

        Map<Integer, Object> lastMessageHasAttachment=messages.stream().collect(Collectors.toMap(
                m -> m.getMessageId(),
                m -> attachmentRepository.existsByMessage(m)
        ));

        List<ChatRoomDto> rooms=chatRooms.stream().map(c -> {
            ChatRoomParticipant participant=myParticipantMap.get(c.getRoomId());

            Integer lastReadMessageId=participant != null ? participant.getLastReadMessageId() : null;

            int unreadCount;

            if (lastReadMessageId == null){
                unreadCount=messageRepository.countByRoom_RoomId(c.getRoomId());
            } else {
                unreadCount=messageRepository.countByRoom_RoomIdAndMessageIdGreaterThan(
                        c.getRoomId(), lastReadMessageId
                );
            }

            ChatMessage lastMessage=lastMessagesMap.get(c.getLastMessageId());

            return ChatRoomDto.builder()
                    .roomId(c.getRoomId())
                    .roomType(c.getRoomType().name())
                    .roomName(c.getRoomName())
                    .createdBy(c.getUser().getUserId())
                    .lastMessageId(c.getLastMessageId())
                    .lastMessageText(lastMessage != null ? lastMessage.getContent():null)
                    .lastMessageAt(c.getLastMessageAt())
                    .lastMessageIsDeleted((boolean)lastMessageIsDeleted.getOrDefault(c.getLastMessageId(), false))
                    .lastMessageHasAttachment((boolean)lastMessageHasAttachment.getOrDefault(c.getLastMessageId(), false))
                    .customRoomName(customRoomNames.getOrDefault(c.getRoomId(), null))
                    .participantCount(counts.getOrDefault(c.getRoomId(), 0L))
                    .unreadCount(unreadCount).build();
        }).toList();

        return rooms;
    }
}

