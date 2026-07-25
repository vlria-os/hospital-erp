import { useCallback, useEffect, useRef, useState } from 'react'
import ChatRoomList from '../component/ChatRoomList'
import ChatRoom from '../component/ChatRoom'
import { Client } from '@stomp/stompjs'
import { chatRoomList, getStaffList } from '../../../api/chatApi'
import AttachmentArchive from '../component/AttachmentArchive'
import { useNavigate } from 'react-router-dom'

const ChatLayout = () => {
  const [selectedRoomId, setSelectedRoomId]     = useState(null);
  const [connected, setConnected]               = useState(false);
  const [rooms, setRooms]                       = useState([]);
  const [staffList, setStaffList]               = useState([]);
  const [webSocketReady, setWebSocketReady]     = useState(false);
  const [roomRefresh, setRoomRefresh]           = useState(0);
  const [showAttachmentArchive, setShowAttachmentArchive] = useState(false);
  const [roomName, setRoomName]                 = useState("");

  const clientRef = useRef(null);
  const navigate  = useNavigate();

  const accessToken = sessionStorage.getItem('accessToken');
  const roles       = sessionStorage.getItem("roles") || [];
  const userId      = sessionStorage.getItem('userId');

  useEffect(() => {
    if (!accessToken) navigate("/login", { replace: true });
    if (roles.includes("PATIENT")) navigate("/", { replace: true });
  }, []);

  const getRooms = useCallback(async () => {
    try {
      const res      = await chatRoomList();
      const roomRes  = res.result.map(room =>
        Number(room.roomId) === Number(selectedRoomId) ? { ...room, unreadCount: 0 } : room
      );
      setRooms(roomRes);

      if (selectedRoomId && !roomRes.some(room => room.roomId === selectedRoomId)) {
        setSelectedRoomId(null);
      }
    } catch (error) { console.error("채팅방 목록 오류:", error); }

    try {
      const staffRes = await getStaffList();
      setStaffList(staffRes.result);
    } catch (error) { console.error("직원 목록 오류:", error); }

    setWebSocketReady(true);
  }, [selectedRoomId]);

  useEffect(() => { getRooms(); }, [getRooms]);

  useEffect(() => {
    if (!webSocketReady) return;
    const token = sessionStorage.getItem("accessToken");
    if (!token) return;

    const client = new Client({
      brokerURL: 'wss://www.xyzoffer.xyz/api/ws',
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      debug: (str) => console.log(str)
    });

    client.onConnect        = () => { console.log("WEBSOCKET_CONNECTED"); setConnected(true); };
    client.onStompError     = (e) => console.error("STOMP_ERROR ==> ", e);
    client.onWebSocketError = (e) => console.error("WEBSOCKET_ERROR ==> ", e);
    client.onWebSocketClose = (e) => { console.error("WEBSOCKET_CLOSE ==> ", e); setConnected(false); };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) { clientRef.current.deactivate(); clientRef.current = null; }
      setConnected(false);
    };
  }, [webSocketReady]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connected) return;

    const sub = client.subscribe(`/topic/chat.list.${userId}`, async (message) => {
      const payload = JSON.parse(message.body);
      if (payload.type === 'ROOM_LIST_REFRESH') {
        await getRooms();
        if (Number(payload.roomId) === Number(selectedRoomId)) setRoomRefresh(prev => prev + 1);
      }
    });

    return () => sub.unsubscribe();
  }, [connected, getRooms, selectedRoomId, userId]);

  const handleReadRoom = (roomId) => {
    setRooms(prev => prev.map(room =>
      Number(room.roomId) === Number(roomId) ? { ...room, unreadCount: 0 } : room
    ));
  };

  const handleLeaveRoomSuccess = async () => {
    setSelectedRoomId(null);
    await getRooms();
  };

  return (
    <div className="flex overflow-hidden bg-white -my-6" style={{ height: 'calc(100% + 48px)' }}>
      {/* 채팅방 목록 */}
      <div className="w-72 shrink-0 border-r border-zinc-200 flex flex-col">
        <ChatRoomList rooms={rooms} selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId} staffList={staffList}
          setStaffList={setStaffList} setRooms={setRooms} />
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatRoom roomId={selectedRoomId} onReadRoom={handleReadRoom}
          clientRef={clientRef} connected={connected}
          onLeaveRoom={handleLeaveRoomSuccess}
          roomRefresh={roomRefresh} getRooms={getRooms}
          setAttachmentArchive={setShowAttachmentArchive}
          setRoomName={setRoomName} />
      </div>

      {/* 첨부 보관함 */}
      {showAttachmentArchive && (
        <div className="w-72 shrink-0 border-l border-zinc-200 flex flex-col">
          <AttachmentArchive roomId={selectedRoomId}
            roomName={roomName} setAttachmentArchive={setShowAttachmentArchive} />
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
