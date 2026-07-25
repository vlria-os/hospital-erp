import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createChatRoom, getStaffList } from '../../../api/chatApi';
import { cn } from '@/lib/utils';
import { MessageSquarePlus, X, Check } from 'lucide-react';

const ChatRoomList = ({ rooms, selectedRoomId, onSelectRoom, staffList, setStaffList, setRooms }) => {
  const userId = useSelector(state => state.auth.userId);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [keyword, setKeyword]                 = useState("");
  const [selectedUsers, setSelectedUsers]     = useState([]);
  const [roomName, setRoomName]               = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const text = keyword.trim();
        const data = text ? await getStaffList(text) : await getStaffList();
        setStaffList(data.result);
      } catch (error) { console.log(error); }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, setStaffList]);

  const formatDate = (dateTime) => {
    if (!dateTime) return '';
    const now = new Date(), d = new Date(dateTime);
    if (d.getFullYear() < now.getFullYear())
      return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
    const isToday = d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
    if (isToday) return `${d.getHours()}시 ${String(d.getMinutes()).padStart(2,'0')}분`;
    return `${d.getMonth()+1}월 ${d.getDate()}일`;
  };

  const handleCloseModal = () => { setOpenCreateModal(false); setKeyword(""); setSelectedUsers([]); setRoomName(""); };

  const handleCreateChatRoom = async () => {
    try {
      const data = {
        roomType: selectedUsers.length >= 2 ? "GROUP" : "DIRECT",
        roomName: roomName || null,
        customRoomName: roomName || null,
        participantUserIds: selectedUsers.map(u => u.userId)
      };
      const res  = await createChatRoom(data);
      const room = res.result;
      setRooms(prev => prev.some(r => Number(r.roomId)===Number(room.roomId)) ? prev : [room, ...prev]);
      onSelectRoom(room.roomId);
      handleCloseModal();
    } catch (error) { console.log(error); alert("채팅방 생성에 실패했습니다."); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200 shrink-0">
        <h1 className="text-base font-bold text-zinc-900">채팅</h1>
        <button type="button" onClick={() => setOpenCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors cursor-pointer">
          <MessageSquarePlus size={13} /> 새 채팅
        </button>
      </div>

      {/* 채팅방 목록 */}
      <div className="flex-1 overflow-y-auto">
        {!userId ? null : rooms.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-zinc-400">
            참여 중인 채팅방이 없습니다.
          </div>
        ) : (
          rooms.map(r => {
            const name        = r.customRoomName ?? r.roomName;
            const showText    = !r.lastMessageIsDeleted && r.lastMessageText !== null;
            const showFile    = !r.lastMessageIsDeleted && r.lastMessageHasAttachment && r.lastMessageText === null;
            const hasNoMsg    = r.lastMessageId === null;
            const isActive    = Number(selectedRoomId) === Number(r.roomId);

            return (
              <div key={r.roomId} onClick={() => onSelectRoom(r.roomId)}
                className={cn("flex flex-col gap-1 px-4 py-3 cursor-pointer border-b border-zinc-100 transition-colors",
                  isActive ? "bg-blue-50 border-l-2 border-l-blue-600" : "hover:bg-zinc-50"
                )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", isActive ? "text-blue-700" : "text-zinc-900")}>
                      {name}
                    </p>
                    {r.participantCount > 2 && (
                      <span className="text-xs text-zinc-400 shrink-0">{r.participantCount}명</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0 ml-2">{formatDate(r.lastMessageAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={cn("text-xs truncate flex-1", isActive ? "text-blue-500" : "text-zinc-500")}>
                    {showText && r.lastMessageText}
                    {showFile && "첨부파일"}
                    {r.lastMessageIsDeleted && "삭제된 메시지입니다."}
                    {hasNoMsg && <span className="italic">아직 메시지가 없습니다</span>}
                  </p>
                  {r.unreadCount > 0 && (
                    <span className="ml-2 shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {r.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 새 채팅 모달 */}
      {openCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-xl w-96 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">새 채팅</h2>
              <button type="button" onClick={handleCloseModal}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer">
                <X size={15} className="text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* 직원 검색 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">직원 검색</label>
                <input type="text" placeholder="이름, 부서, 직책으로 검색하세요" value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  className="w-full h-9 rounded-lg border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* 선택된 직원 */}
              {selectedUsers.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">선택됨</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map(user => (
                      <div key={user.userId}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        <span>{user.username}</span>
                        <button type="button" onClick={() => setSelectedUsers(prev => prev.filter(u => u.userId !== user.userId))}
                          className="cursor-pointer hover:text-blue-900"><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 그룹 채팅방 이름 */}
              {selectedUsers.length >= 2 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">채팅방 이름</label>
                  <input type="text" placeholder="그룹 채팅방 이름을 입력하세요" value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    className="w-full h-9 rounded-lg border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              {/* 직원 목록 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">직원 목록</label>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {staffList.map(user => {
                    const selected = selectedUsers.some(u => u.userId === user.userId);
                    return (
                      <div key={user.userId}
                        onClick={() => selected
                          ? setSelectedUsers(prev => prev.filter(u => u.userId !== user.userId))
                          : setSelectedUsers(prev => [...prev, user])
                        }
                        className={cn("flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                          selected ? "bg-blue-50 border border-blue-200" : "hover:bg-zinc-50 border border-transparent"
                        )}>
                        <div>
                          <p className="text-sm font-medium text-zinc-800">{user.username}</p>
                          <p className="text-xs text-zinc-400">{user.department} / {user.role}</p>
                        </div>
                        {selected && <Check size={15} className="text-blue-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex gap-2 px-5 py-4 border-t border-zinc-100">
              <button type="button" onClick={handleCloseModal}
                className="flex-1 h-9 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer">
                취소
              </button>
              <button type="button" onClick={handleCreateChatRoom}
                disabled={selectedUsers.length === 0 || (selectedUsers.length >= 2 && !roomName.trim())}
                className="flex-1 h-9 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                {selectedUsers.length >= 2 ? "그룹 채팅 생성" : "채팅 시작"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoomList;
