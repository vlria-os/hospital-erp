import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Send, Upload, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const API_BASE_URL = import.meta.env.VITE_CHATBOT_API_BASE_URL;

const InquiryChatBotPage = () => {
  const [question, setQuestion]         = useState("");
  const [messages, setMessages]         = useState([]);
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf]   = useState(null);
  const [askLoading, setAskLoading]     = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const messageAreaRef = useRef(null);
  const roles = sessionStorage.getItem("roles") || "";
  const isAdmin = roles.includes("ADMIN");

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const upload = async () => {
    if (!selectedPdf) { alert("파일을 선택하세요"); return; }
    if (uploadLoading) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedPdf);
      const res  = await fetch(`${API_BASE_URL}/ai/chatbot/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "PDF 업로드 실패!");
      if (data.success) {
        alert(data.message || "PDF 업로드 성공!");
        setSelectedPdf(null); setOpenPdfModal(false);
      } else { alert(data.message || "PDF 업로드 실패"); }
    } catch (error) {
      alert(error.message || "PDF 업로드 중 오류가 발생했습니다.");
    } finally { setUploadLoading(false); }
  };

  const ask = async () => {
    const trimmed = question.trim();
    if (!trimmed) { alert("질문을 입력하세요."); return; }
    if (askLoading) return;

    setAskLoading(true);
    setMessages((prev) => [...prev, { role: 'USER', content: trimmed }]);
    setQuestion("");

    try {
      const res  = await fetch(`${API_BASE_URL}/ai/chatbot/chat`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        const data=await res.json;
        throw new Error(data?.detail || "문의 요청 실패!");
      }

      //빈 AI 메시지 먼저 추가 후 로딩 점 제거
      setMessages((prev) => [...prev, {role:'AI', content:''}]);
      setAskLoading(false);

      const reader=res.body.getReader();
      const decoder=new TextDecoder();
      let buffer='';

      while(true){
        const { done, value } = await reader.read();
        if(done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines=buffer.split('\n');
        buffer=lines.pop() ?? ''; //불완전한 마지막 줄은 버퍼에 유지

        for(const line of lines){
          if(!line.startsWith('data')) continue;

          try{
            const data=JSON.parse(line.slice(6));

            //토큰 수신 -> 마지막 AI 메시지에 이어 붙이기
            if(data.token){
              setMessages((prev) => {
                const updated=[...prev];
                const last=updated[updated.length - 1];

                updated[updated.length - 1]={...last, content: last.content + data.token};

                return updated;
              });
            }

            //BLOCKED/NEEDS_CLARIFICATION 등 토큰 없이 끝나는 경우
            if(data.done && data.answer){
              setMessages((prev) => {
                const updated=[...prev];
                const last=updated[updated.length - 1];

                if(last.role === 'AI' && last.content === ''){
                  updated[updated.length - 1]={...last, content: data.answer};
                }

                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated=[...prev];
        const last=updated[updated.length - 1];

        //빈 AI 메시지가 있으면 오류 메시지로 교체
        if(last?.role === 'AI' && last.content === ''){
          updated[updated.length - 1] = {...last, content: error.message || "오류가 발생했습니다. 잠시 후 다시 시도해주세요."};
          return updated;
        }

        return [...updated, {role:'AI', content:error.message || '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}];
      });
    } finally { setAskLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-13rem)] px-6 pt-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-blue-600" />
          <h1 className="text-lg font-bold text-zinc-900">AI 문의 챗봇</h1>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" onClick={() => setOpenPdfModal(true)}>
            <Upload size={13} /> PDF 수정
          </Button>
        )}
      </div>

      {/* 메시지 영역 */}
      <div
        ref={messageAreaRef}
        className="flex-1 overflow-y-auto bg-white rounded-2xl border border-zinc-200 p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Bot size={24} className="text-blue-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600">무엇이 궁금하신가요?</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              병원 이용 규정, 운영 시간,<br />접수 및 예약 관련 내용을 질문해보세요.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn("flex items-end gap-2", msg.role === 'USER' ? "flex-row-reverse" : "flex-row")}
            >
              {/* 아바타 */}
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                msg.role === 'USER' ? "bg-zinc-200" : "bg-blue-600"
              )}>
                {msg.role === 'USER'
                  ? <User size={13} className="text-zinc-500" />
                  : <Bot size={13} className="text-white" />
                }
              </div>

              {/* 말풍선 */}
              <div className={cn(
                "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === 'USER'
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-zinc-100 text-zinc-800 rounded-bl-sm"
              )}>
                {msg.content}
              </div>
            </div>
          ))
        )}

        {askLoading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* 입력창 */}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); ask(); }}
      >
        <Input
          type="text"
          placeholder="AI 챗봇에게 질문해보세요."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={askLoading} className="gap-1.5 shrink-0 cursor-pointer">
          <Send size={14} /> 전송
        </Button>
      </form>

      {/* PDF 업로드 모달 */}
      <Dialog open={openPdfModal} onOpenChange={(v) => { if (!uploadLoading) setOpenPdfModal(v); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>PDF 파일 업로드</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); upload(); }} className="space-y-4 mt-2">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setSelectedPdf(e.target.files[0])}
              className="text-sm text-zinc-600 w-full"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button" variant="outline" className="cursor-pointer"
                onClick={() => { setSelectedPdf(null); setOpenPdfModal(false); }}
              >취소</Button>
              <Button type="submit" disabled={uploadLoading} className="cursor-pointer">
                {uploadLoading ? "업로드 중..." : "확인"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InquiryChatBotPage;
