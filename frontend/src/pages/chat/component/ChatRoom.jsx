import { useEffect, useRef, useState } from 'react'
import { chatRoomDetail, deleteMessage, editMessage, getStaffListForInvite, inviteStaff, leaveChatRoom, markAsRead, uploadAttachment } from '../../../api/chatApi';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { Paperclip, Send, X, ChevronDown, Check, Users } from 'lucide-react';

// ── 파일 타입 유틸 ─────────────────────────────────────────────────────────────
const getAttachmentType = (file) => {
  const ct = file.contentType || "", ext = (file.fileExtension||"").toLowerCase();
  if (ct.startsWith("image/")) return "image";
  if (ct.startsWith("video/")) return "video";
  if (ct === "application/pdf") return "pdf";
  if (ext==="xls"||ext==="xlsx"||ct.includes("spreadsheet")||ct.includes("excel")) return "excel";
  if (ext==="doc"||ext==="docx"||ct.includes("word")) return "word";
  if (ext==="ppt"||ext==="pptx"||ct.includes("presentation")||ct.includes("powerpoint")) return "ppt";
  return "file";
};

const fileIcon = (t) => t==="pdf"?"📄":t==="excel"?"📊":t==="video"?"🎥":t==="word"?"📝":t==="ppt"?"📽️":"📎";

// ── 첨부파일 아이템 ────────────────────────────────────────────────────────────
const AttachmentItem = ({ file }) => {
  const t = getAttachmentType(file);
  if (t === "image") return (
    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden max-w-xs hover:opacity-90 transition-opacity">
      <img src={file.fileUrl} alt={file.originalFileName} className="w-full object-cover" />
    </a>
  );
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/10 text-xs">
      <span>{fileIcon(t)}</span>
      <div>
        <a href={file.fileUrl} target="_blank" rel="noreferrer"
          className="font-medium hover:underline truncate block max-w-40">{file.originalFileName}</a>
        <p className="opacity-60">{t.toUpperCase()}</p>
      </div>
    </div>
  );
};

// ── 답장 모달 ──────────────────────────────────────────────────────────────────
const ReplyModal = ({ handleReply, onClose, setReplyContent, parentMessage, replyContent }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
    <div className="bg-white rounded-t-2xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="px-4 pt-4 pb-2 border-b border-zinc-100">
        <p className="text-xs font-semibold text-zinc-400 mb-2">답장할 메시지</p>
        {parentMessage?.attachments?.length > 0 && (
          <div className="flex gap-1 mb-1">{parentMessage.attachments.map(f => <AttachmentItem key={f.attachmentId} file={f} />)}</div>
        )}
        <textarea value={parentMessage?.content ?? ""} rows={2} readOnly
          className="w-full text-sm text-zinc-600 bg-zinc-50 rounded-lg p-2 resize-none focus:outline-none" />
      </div>
      <form className="p-4 space-y-2" onSubmit={e => { e.preventDefault(); handleReply(); }}>
        <textarea rows={3} value={replyContent} onChange={e => setReplyContent(e.target.value)}
          placeholder="답장 메시지를 입력하세요..." autoFocus
          className="w-full text-sm rounded-lg border border-zinc-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 h-9 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 cursor-pointer">취소</button>
          <button type="submit"
            className="flex-1 h-9 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">전송</button>
        </div>
      </form>
    </div>
  </div>
);

// ── 수정 모달 ──────────────────────────────────────────────────────────────────
const EditMessageModal = ({ editContent, handleEditMessage, onClose, setEditContent }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
    <div className="bg-white rounded-2xl w-96 shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="px-5 py-4 border-b border-zinc-100">
        <p className="text-sm font-semibold text-zinc-900">메시지 수정</p>
      </div>
      <div className="p-5 space-y-3">
        <textarea value={editContent} rows={3} onChange={e => setEditContent(e.target.value)} autoFocus
          className="w-full text-sm rounded-lg border border-zinc-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-2">
          <button className="flex-1 h-9 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 cursor-pointer" onClick={onClose} type="button">취소</button>
          <button type="button" className="flex-1 h-9 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer" onClick={handleEditMessage}>확인</button>
        </div>
      </div>
    </div>
  </div>
);

// ── 참여자 모달 ────────────────────────────────────────────────────────────────
const ParticipantModal = ({ participants, userId, onClose, isGroup, handleOpenInviteModal }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
    <div className="bg-white rounded-2xl w-80 shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h3 className="text-sm font-bold text-zinc-900">대화 상대 ({participants.length}명)</h3>
        <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 cursor-pointer" onClick={onClose} type="button">
          <X size={14} className="text-zinc-500" />
        </button>
      </div>
      <div className="px-5 py-3 max-h-60 overflow-y-auto space-y-2">
        {participants.map(p => (
          <div key={p.participantId} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-zinc-600">{p.userName?.[0]}</span>
            </div>
            <p className="text-sm text-zinc-800">{p.userName}</p>
            {p.userId === userId && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">나</span>}
          </div>
        ))}
      </div>
      {isGroup && (
        <div className="px-5 py-4 border-t border-zinc-100">
          <button onClick={handleOpenInviteModal} type="button"
            className="w-full h-9 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">초대하기</button>
        </div>
      )}
    </div>
  </div>
);

// ── 초대 모달 ──────────────────────────────────────────────────────────────────
const InviteModal = ({ inviteStaffList, selectedStaffIds, onToggleStaff, onInvite, onClose, onBack }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
    <div className="bg-white rounded-2xl w-80 shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h3 className="text-sm font-bold text-zinc-900">직원 초대</h3>
        <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 cursor-pointer" onClick={onClose} type="button">
          <X size={14} className="text-zinc-500" />
        </button>
      </div>
      <div className="px-5 py-3 max-h-60 overflow-y-auto space-y-1">
        {inviteStaffList.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">초대 가능한 직원이 없습니다.</p>
        ) : inviteStaffList.map(staff => (
          <label key={staff.userId} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-50 cursor-pointer">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={selectedStaffIds.includes(staff.userId)} onChange={() => onToggleStaff(staff.userId)} className="accent-blue-600 w-4 h-4" />
              <div>
                <p className="text-sm font-medium text-zinc-800">{staff.username}</p>
                <p className="text-xs text-zinc-400">{staff.department}{staff.role ? ` / ${staff.role}` : ''}</p>
              </div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-2 px-5 py-4 border-t border-zinc-100">
        <button type="button" onClick={onBack} className="flex-1 h-9 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 cursor-pointer">뒤로가기</button>
        <button type="button" onClick={onInvite} className="flex-1 h-9 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">초대하기</button>
      </div>
    </div>
  </div>
);

// ── ChatRoom 메인 ──────────────────────────────────────────────────────────────
const ChatRoom = ({ roomId, clientRef, connected, onReadRoom, onLeaveRoom, roomRefresh, getRooms, setAttachmentArchive, setRoomName }) => {
  const [room, setRoom]                         = useState(null);
  const [messageSlice, setMessageSlice]         = useState({ messages: [], hasNext: false, nextCursor: null });
  const [loading, setLoading]                   = useState(false);
  const [loadingOld, setLoadingOld]             = useState(false);
  const [content, setContent]                   = useState("");
  const [hasNewMessage, setHasNewMessage]       = useState(false);
  const [participants, setParticipants]         = useState([]);
  const [openParticipantModal, setOpenParticipantModal] = useState(false);
  const [openInviteModal, setOpenInviteModal]   = useState(false);
  const [inviteStaffList, setInviteStaffList]   = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [openPopId, setOpenPopId]               = useState(null);
  const [editContent, setEditContent]           = useState("");
  const [openEditModal, setOpenEditModal]       = useState(false);
  const [targetMessageId, setTargetMessageId]   = useState(null);
  const [openReplyModal, setOpenReplyModal]     = useState(false);
  const [parentMessage, setParentMessage]       = useState(null);
  const [selectedFiles, setSelectedFiles]       = useState([]);

  const subscriptionRef    = useRef(null);
  const readSubscriptionRef = useRef(null);
  const updateSubscriptionRef = useRef(null);
  const messageAreaRef     = useRef(null);
  const firstLoadRef       = useRef(true);
  const syncingReadRef     = useRef(false);
  const pendingReadSyncRef = useRef(false);
  const popoverRef         = useRef(null);
  const fileInputRef       = useRef(null);

  const userId  = Number(sessionStorage.getItem("userId"));
  const isGroup = room?.roomType === 'GROUP';

  const applyReadStatus = (readStatus) => {
    setMessageSlice(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
        if (msg.messageType !== 'USER') return msg;
        if (msg.senderId === readStatus.userId) return msg;
        if (msg.messageId <= readStatus.lastReadMessageId) return { ...msg, unreadCount: Math.max((msg.unreadCount??0)-1, 0) };
        return msg;
      })
    }));
  };

  useEffect(() => {
    setSelectedStaffIds([]); setInviteStaffList([]); setOpenParticipantModal(false); setOpenInviteModal(false);
    syncingReadRef.current = false; pendingReadSyncRef.current = false; setSelectedFiles([]);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setRoom(null); setParticipants([]); setMessageSlice({ messages:[], hasNext:false, nextCursor:null });
      setContent(""); setHasNewMessage(false); firstLoadRef.current = true;
      syncingReadRef.current = false; pendingReadSyncRef.current = false;
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await chatRoomDetail({ roomId, cursor: null });
        setRoom(data.result.room); setParticipants(data.result.participants??[]);
        setMessageSlice(data.result.messages); onReadRoom(roomId); setHasNewMessage(false); firstLoadRef.current = true;
      } catch (e) { console.log(e); } finally { setLoading(false); }
    };
    setContent(""); load();
  }, [roomId]);

  useEffect(() => {
    if (openPopId === null) return;
    const h = (e) => { if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpenPopId(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openPopId]);

  useEffect(() => {
    if (!firstLoadRef.current) return;
    const c = messageAreaRef.current;
    if (!c || !messageSlice.messages.length) return;
    c.scrollTop = c.scrollHeight; firstLoadRef.current = false;
  }, [messageSlice.messages]);

  const updateMessageInState = (updateMessage) => {
    setMessageSlice(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
        const parent = msg.parentMessage;
        if (msg.messageId === updateMessage.messageId) return { ...msg, ...updateMessage };
        if (parent && parent.parentMessageId === updateMessage.messageId) {
          return { ...msg, parentMessage: { ...parent, parentMessageContent: updateMessage.deleted ? null : updateMessage.content, parentMessageIsDeleted: !!updateMessage.deleted } };
        }
        return msg;
      })
    }));
  };

  useEffect(() => {
    const client = clientRef.current;
    if (!roomId || !client || !connected) return;

    [subscriptionRef, readSubscriptionRef, updateSubscriptionRef].forEach(r => { if (r.current) { r.current.unsubscribe(); r.current = null; } });

    subscriptionRef.current = client.subscribe(`/topic/chat.room.${roomId}`, async (message) => {
      const msg = JSON.parse(message.body);
      const nearBottom = isNearBottom(), isMine = Number(msg.senderId) === Number(userId);
      setMessageSlice(prev => ({ ...prev, messages: [...prev.messages, { ...msg, mine: isMine }] }));
      getRooms();
      if (nearBottom || isMine) {
        await markAsRead(roomId); onReadRoom(roomId);
        setTimeout(() => { const c = messageAreaRef.current; if (c) c.scrollTop = c.scrollHeight; }, 0);
      } else { setHasNewMessage(true); }
    });

    readSubscriptionRef.current = client.subscribe(`/topic/chat.room.${roomId}.read`, async (message) => {
      const readStatus = JSON.parse(message.body);
      if (!isGroup) { applyReadStatus(readStatus); return; }
      if (syncingReadRef.current) { pendingReadSyncRef.current = true; return; }
      syncingReadRef.current = true;
      try {
        while (true) {
          pendingReadSyncRef.current = false;
          const res = await chatRoomDetail({ roomId, cursor: null });
          setMessageSlice(prev => ({ ...prev, messages: prev.messages.map(prevMsg => {
            const fresh = (res.result.messages?.messages??[]).find(m => m.messageId === prevMsg.messageId);
            return fresh ? { ...prevMsg, unreadCount: fresh.unreadCount } : prevMsg;
          })}));
          if (!pendingReadSyncRef.current) break;
        }
      } catch (e) { console.log(e); } finally { syncingReadRef.current = false; }
    });

    updateSubscriptionRef.current = client.subscribe(`/topic/chat.room.${roomId}.message.update`, async (message) => {
      const payload = JSON.parse(message.body);
      if (payload.result.lastMessage) await getRooms();
      updateMessageInState(payload.result);
    });

    return () => { [subscriptionRef, readSubscriptionRef, updateSubscriptionRef].forEach(r => { if (r.current) { r.current.unsubscribe(); r.current = null; } }); };
  }, [roomId, clientRef, connected, isGroup, getRooms]);

  useEffect(() => {
    if (!roomId || roomRefresh === 0) return;
    const reload = async () => {
      try { const data = await chatRoomDetail({ roomId, cursor: null }); setRoom(data.result.room); setParticipants(data.result.participants??[]); }
      catch (e) { console.log(e); }
    };
    reload();
  }, [roomRefresh, roomId]);

  const sendMessage = async () => {
    const text = content.trim(), client = clientRef.current;
    if (!text && selectedFiles.length === 0) { alert("메세지 내용을 입력하거나 파일을 첨부하세요."); return; }
    if (!client || !connected) { alert("웹소켓 연결이 아직 완료되지 않았습니다."); return; }
    try {
      let uploadFiles = [];
      if (selectedFiles.length > 0) { const res = await uploadAttachment(selectedFiles); uploadFiles = res.result??[]; }
      client.publish({ destination: `/app/chat/send/user`, body: JSON.stringify({ roomId, content: text, parentMessageId: targetMessageId||null, attachments: uploadFiles }) });
      setContent(""); setParentMessage(null); setOpenReplyModal(false); setTargetMessageId(null); setSelectedFiles([]);
    } catch (e) { console.log(e); alert("메시지 전송이 실패했습니다."); }
  };

  const loadOlderMessages = async () => {
    if (!roomId || loadingOld || !messageSlice.hasNext) return;
    const c = messageAreaRef.current; if (!c) return;
    const prevH = c.scrollHeight, prevT = c.scrollTop;
    try {
      setLoadingOld(true);
      const data = await chatRoomDetail({ roomId, cursor: messageSlice.nextCursor });
      const older = data.result.messages;
      setMessageSlice(prev => ({ ...prev, messages: [...older.messages, ...prev.messages], hasNext: older.hasNext, nextCursor: older.nextCursor }));
      setTimeout(() => { c.scrollTop = c.scrollHeight - prevH + prevT; }, 0);
    } catch (e) { console.log(e); } finally { setLoadingOld(false); }
  };

  const isNearBottom = () => { const c = messageAreaRef.current; return c ? c.scrollHeight - c.scrollTop - c.clientHeight <= 80 : false; };

  const handleOpenInviteModal = async () => {
    try { const data = await getStaffListForInvite(roomId); setInviteStaffList(data.result); setOpenParticipantModal(false); setOpenInviteModal(true); }
    catch (e) { console.log(e); alert("초대 가능한 직원 목록 조회 실패!"); }
  };

  const handleToggleInvite = (id) => setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(i => i!==id) : [...prev, id]);

  const handleInviteStaff = async () => {
    if (selectedStaffIds.length === 0) { alert("초대할 직원을 선택하세요."); return; }
    try { await inviteStaff(roomId, selectedStaffIds); alert("직원 초대가 완료되었습니다."); setSelectedStaffIds([]); setOpenInviteModal(false); }
    catch (e) { console.log(e); alert("직원 초대 실패!"); return; }
    try { const data = await chatRoomDetail({ roomId, cursor: null }); setRoom(data.result.room); setParticipants(data.result.participants??[]); }
    catch (e) { console.log(e); }
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm("채팅방에서 퇴장하시겠습니까?")) return;
    try { await leaveChatRoom(roomId); alert("채팅방에서 퇴장했습니다."); if (onLeaveRoom) onLeaveRoom(); }
    catch (e) { console.log(e); alert("채팅방 퇴장 실패!"); }
  };

  const handleScroll = async () => {
    const c = messageAreaRef.current; if (!c) return;
    if (c.scrollTop <= 50) await loadOlderMessages();
    if (c.scrollHeight - c.scrollTop - c.clientHeight <= 80 && hasNewMessage) {
      setHasNewMessage(false); await markAsRead(roomId); onReadRoom(roomId);
    }
  };

  const handleEditMessage = async (messageId) => {
    try { const res = await editMessage(messageId, editContent); updateMessageInState(res.result); await getRooms(); setEditContent(""); setTargetMessageId(null); setOpenEditModal(false); setOpenPopId(null); }
    catch (e) { console.log(e); }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("메시지를 삭제하시겠습니까?")) return;
    try { const res = await deleteMessage(Number(messageId)); updateMessageInState(res.result); await getRooms(); setOpenPopId(null); }
    catch (e) { console.log(e); }
  };

  const replyModalClose = () => { setContent(""); setOpenReplyModal(false); setTargetMessageId(null); setOpenPopId(null); setParentMessage(null); setSelectedFiles([]); };
  const editMessageModalClose = () => { setEditContent(""); setOpenEditModal(false); setTargetMessageId(null); };

  const shouldShowTime = (cur, next) => {
    if (!next) return true;
    if (cur.senderId !== next.senderId) return true;
    return (new Date(next.createdAt) - new Date(cur.createdAt)) / 60000 >= 1;
  };
  const shouldShowDate = (cur, prev) => {
    const d1 = new Date(cur), d2 = new Date(prev);
    return d1.getFullYear()!==d2.getFullYear() || d1.getMonth()!==d2.getMonth() || d1.getDate()!==d2.getDate();
  };

  const orderedMessages   = messageSlice.messages;
  const lastMyUserMsgId   = [...orderedMessages].reverse().find(m => m.senderId===userId && m.messageType==='USER')?.messageId ?? null;
  const shouldShowUnread  = (msg, isMine) => {
    if (!isMine || msg.messageType!=='USER' || !msg.unreadCount || msg.unreadCount<=0) return false;
    return room?.roomType==="DIRECT" ? msg.messageId===lastMyUserMsgId : true;
  };

  if (!roomId) return (
    <div className="flex-1 flex items-center justify-center h-full bg-zinc-50">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center mx-auto">
          <Users size={22} className="text-zinc-400" />
        </div>
        <p className="text-sm text-zinc-400">채팅방을 선택하세요</p>
      </div>
    </div>
  );

  if (!room) return (
    <div className="flex-1 flex items-center justify-center h-full bg-zinc-50">
      <p className="text-sm text-zinc-400">불러오는 중...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          {isGroup && (
            <button onClick={handleLeaveRoom} type="button"
              className="text-xs text-zinc-400 hover:text-red-500 transition-colors cursor-pointer">나가기</button>
          )}
          <p className="text-sm font-bold text-zinc-900">
            {room.customRoomName ?? room.roomName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            type="button" onClick={() => setOpenParticipantModal(true)}>
            <Users size={13} /> {participants.length}명
          </button>
          <button type="button"
            className="text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            onClick={() => { setRoomName(room.customRoomName??room.roomName); setAttachmentArchive(true); }}>
            보관함
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div ref={messageAreaRef} onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-zinc-50">
        {orderedMessages.map((m, idx) => {
          const prev    = orderedMessages[idx - 1];
          const next    = orderedMessages[idx + 1];
          const showDate = !prev || shouldShowDate(m.createdAt, prev.createdAt);
          const isMine  = Number(m.senderId) === Number(userId);

          // 날짜 구분선
          const dateDivider = showDate ? (
            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs text-zinc-400">{dayjs(m.createdAt).format('YYYY년 M월 D일')}</span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>
          ) : null;

          // 시스템 메시지
          if (m.messageType === 'SYSTEM') return (
            <div key={m.messageId}>
              {dateDivider}
              <div className="flex justify-center my-2">
                <span className="text-xs text-zinc-400 bg-zinc-200 px-3 py-1 rounded-full">{m.content}</span>
              </div>
            </div>
          );

          const canDelete  = isMine && !m.deleted && m.messageType!=='SYSTEM';
          const canReply   = !m.deleted && m.messageType==='USER';
          const canEdit    = isMine && !m.deleted && m.messageType!=='SYSTEM' && m.content!==null;
          const canOpenPop = canDelete || canEdit || canReply;

          const msgText = m.deleted ? '삭제된 메시지입니다.' : m.edited && !m.deleted ? m.content+' (수정됨)' : m.content;

          // reply preview
          const ReplyPreview = m.parentMessage ? (
            <div className={cn("rounded-lg p-2 mb-1.5 text-xs border-l-2", isMine ? "bg-white/20 border-white/50" : "bg-zinc-100 border-zinc-300")}>
              <p className={cn("font-semibold mb-0.5", isMine ? "text-white/80" : "text-zinc-500")}>
                {m.parentMessage.parentMessageUserName ?? '알 수 없음'}
              </p>
              {m.parentMessage.parentMessageIsDeleted
                ? <p className="opacity-70 italic">삭제된 메시지입니다.</p>
                : <p className="opacity-80 truncate">{m.parentMessage.parentMessageContent}</p>
              }
            </div>
          ) : null;

          return (
            <div key={m.messageId}>
              {dateDivider}
              {!isMine && <p className="text-[11px] text-zinc-400 ml-1 mb-0.5">{m.senderName}</p>}
              <div className={cn("flex items-end gap-1.5 mb-1.5", isMine ? "flex-row-reverse" : "flex-row")}>
                {/* 버블 영역 */}
                <div className="relative max-w-sm">
                  <div className={cn("px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                    isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white text-zinc-800 border border-zinc-200 rounded-bl-sm",
                    m.deleted && "opacity-50 italic"
                  )}>
                    {ReplyPreview}
                    {m.attachments?.length > 0 && (
                      <div className="mb-1.5 space-y-1">
                        {m.attachments.map(f => <AttachmentItem key={f.attachmentId} file={f} />)}
                      </div>
                    )}
                    {msgText && <p>{msgText}</p>}
                  </div>

                  {/* 팝오버 버튼 */}
                  {canOpenPop && (
                    <button type="button"
                      className={cn("absolute top-1 text-zinc-300 hover:text-zinc-600 text-lg leading-none cursor-pointer",
                        isMine ? "-left-5" : "-right-5"
                      )}
                      onClick={e => { e.stopPropagation(); setOpenPopId(prev => prev===m.messageId ? null : m.messageId); }}>
                      ⋮
                    </button>
                  )}

                  {/* 팝오버 메뉴 */}
                  {Number(openPopId)===Number(m.messageId) && (
                    <div ref={popoverRef} onClick={e => e.stopPropagation()}
                      className={cn("absolute top-6 z-20 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 min-w-24",
                        isMine ? "right-0" : "left-0"
                      )}>
                      {canReply && (
                        <button type="button" className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                          onClick={() => { setTargetMessageId(m.messageId); setParentMessage(m); setOpenReplyModal(true); setOpenPopId(null); setSelectedFiles([]); }}>답장</button>
                      )}
                      {canEdit && (
                        <button type="button" className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                          onClick={() => { setEditContent(m.content); setTargetMessageId(m.messageId); setOpenEditModal(true); setOpenPopId(null); }}>수정</button>
                      )}
                      {canDelete && (
                        <button type="button" className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 cursor-pointer"
                          onClick={() => handleDeleteMessage(m.messageId)}>삭제</button>
                      )}
                    </div>
                  )}
                </div>

                {/* 시간 + 읽지 않음 */}
                <div className={cn("flex flex-col items-end gap-0.5 pb-0.5 shrink-0", isMine ? "items-end" : "items-start")}>
                  {shouldShowUnread(m, isMine) && (
                    <span className="text-[10px] text-amber-500 font-medium">{m.unreadCount}</span>
                  )}
                  {shouldShowTime(m, next) && (
                    <span className="text-[10px] text-zinc-400">{dayjs(m.createdAt).format('HH:mm')}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 새 메시지 알림 */}
      {hasNewMessage && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <button type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-medium shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
            onClick={async () => {
              const c = messageAreaRef.current; if (c) c.scrollTop = c.scrollHeight;
              setHasNewMessage(false); await markAsRead(roomId); onReadRoom(roomId);
            }}>
            <ChevronDown size={13} /> 새 메시지
          </button>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="shrink-0 border-t border-zinc-200 bg-white">
        {/* 첨부파일 미리보기 */}
        {selectedFiles.length > 0 && (
          <div className="px-4 pt-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs">
                <span className="text-zinc-700 truncate max-w-32">{file.name}</span>
                <span className="text-zinc-400">{(file.size/1024/1024).toFixed(1)}MB</span>
                <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_,i)=>i!==idx))}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"><X size={11} /></button>
              </div>
            ))}
          </div>
        )}
        <form className="flex items-end gap-2 px-4 py-3"
          onSubmit={e => { e.preventDefault(); sendMessage(); }}>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors cursor-pointer">
            <Paperclip size={18} />
          </button>
          <input type="file" ref={fileInputRef} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden" multiple onChange={e => { const files=Array.from(e.target.files||[]); if(files.length) setSelectedFiles(prev=>[...prev,...files]); e.target.value=""; }} />
          <textarea value={content} placeholder="메시지를 입력하세요." rows={1}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); if(content.trim()) sendMessage(); } }}
            className="flex-1 resize-none rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto" />
          <button type="submit"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
            disabled={!content.trim() && selectedFiles.length===0}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* 모달들 */}
      {openParticipantModal && <ParticipantModal participants={participants} userId={userId} onClose={() => setOpenParticipantModal(false)} isGroup={isGroup} handleOpenInviteModal={handleOpenInviteModal} />}
      {openInviteModal && <InviteModal inviteStaffList={inviteStaffList} selectedStaffIds={selectedStaffIds} onToggleStaff={handleToggleInvite} onInvite={handleInviteStaff} onClose={() => { setSelectedStaffIds([]); setOpenInviteModal(false); }} onBack={() => { setSelectedStaffIds([]); setOpenInviteModal(false); setOpenParticipantModal(true); }} />}
      {openEditModal && <EditMessageModal editContent={editContent} handleEditMessage={() => handleEditMessage(targetMessageId)} onClose={editMessageModalClose} setEditContent={setEditContent} />}
      {openReplyModal && <ReplyModal handleReply={sendMessage} setReplyContent={setContent} parentMessage={parentMessage} onClose={replyModalClose} replyContent={content} />}
    </div>
  );
};

export default ChatRoom;
