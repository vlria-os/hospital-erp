import { useEffect, useRef, useState } from 'react'
import { openAttachmentArchive } from '../../../api/chatApi';
import dayjs from 'dayjs';
import { X } from 'lucide-react';

const getAttachmentType = (file) => {
  const contentType = file.contentType || "";
  const ext = (file.fileExtension || "").toLowerCase();
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";
  if (ext==="xls"||ext==="xlsx"||contentType.includes("spreadsheet")||contentType.includes("excel")) return "excel";
  if (ext==="doc"||ext==="docx"||contentType.includes("word")) return "word";
  if (ext==="ppt"||ext==="pptx"||contentType.includes("presentation")||contentType.includes("powerpoint")) return "ppt";
  return "file";
};

const AttachmentItem = ({ file }) => {
  const fileType = getAttachmentType(file);
  const icon = fileType==="pdf"?"📄":fileType==="excel"?"📊":fileType==="video"?"🎥":fileType==="word"?"📝":fileType==="ppt"?"📽️":"📎";

  if (fileType === "image") {
    return (
      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer"
        className="block rounded-lg overflow-hidden border border-zinc-200 hover:opacity-90 transition-opacity">
        <img src={file.fileUrl} alt={file.originalFileName} className="w-full object-cover max-h-40" />
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50">
      <span className="text-xl shrink-0">{icon}</span>
      <div className="min-w-0">
        <a href={file.fileUrl} target="_blank" rel="noreferrer"
          className="text-xs font-medium text-blue-600 hover:underline truncate block">{file.originalFileName}</a>
        <p className="text-[10px] text-zinc-400 mt-0.5">{fileType.toUpperCase()}</p>
      </div>
    </div>
  );
};

const AttachmentArchive = ({ roomId, roomName, setAttachmentArchive }) => {
  const [attachmentSlice, setAttachmentSlice] = useState({ attachments: [], hasNext: false, nextCursor: null });
  const [loadingOld, setLoadingOld]           = useState(false);
  const attachmentAreaRef = useRef(null);

  useEffect(() => {
    if (!roomId) { setAttachmentSlice({ attachments: [], hasNext: false, nextCursor: null }); return; }
    const load = async () => {
      try {
        const data = await openAttachmentArchive({ roomId, cursor: null });
        setAttachmentSlice({ attachments: data.slice.attachments, hasNext: data.slice.hasNext, nextCursor: data.slice.nextCursor });
        if (attachmentAreaRef.current) attachmentAreaRef.current.scrollTop = 0;
      } catch (error) { console.log(error); }
    };
    load();
  }, [roomId]);

  const loadingOlderAttachments = async () => {
    if (loadingOld || !attachmentSlice.hasNext) return;
    setLoadingOld(true);
    try {
      const data = await openAttachmentArchive({ roomId, cursor: attachmentSlice.nextCursor });
      setAttachmentSlice(prev => ({ attachments: [...prev.attachments, ...data.slice.attachments], hasNext: data.slice.hasNext, nextCursor: data.slice.nextCursor }));
    } catch (error) { console.log(error); }
    finally { setLoadingOld(false); }
  };

  const handleScroll = () => {
    const c = attachmentAreaRef.current;
    if (!c || loadingOld || !attachmentSlice.hasNext) return;
    if (c.scrollHeight - c.scrollTop - c.clientHeight <= 80) loadingOlderAttachments();
  };

  const grouped = Object.entries(
    attachmentSlice.attachments.reduce((acc, file) => {
      const date = dayjs(file.createdAt).format("YYYY-MM-DD");
      if (!acc[date]) acc[date] = [];
      acc[date].push(file);
      return acc;
    }, {})
  ).sort((a, b) => dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf())
   .map(([date, files]) => ({ date, files: files.sort((a,b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()) }));

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200 shrink-0">
        <div>
          <p className="text-xs text-zinc-400">보관함</p>
          <p className="text-sm font-semibold text-zinc-900 truncate max-w-44">{roomName}</p>
        </div>
        <button type="button" onClick={() => setAttachmentArchive(false)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer">
          <X size={15} className="text-zinc-500" />
        </button>
      </div>

      {/* 첨부파일 목록 */}
      <div ref={attachmentAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {grouped.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-zinc-400">첨부파일이 없습니다.</div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              <p className="text-xs font-semibold text-zinc-400 mb-2">
                {dayjs(group.date).format("YYYY년 M월 D일")}
              </p>
              <div className="space-y-2">
                {group.files.map(file => <AttachmentItem key={file.attachmentId} file={file} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttachmentArchive;
