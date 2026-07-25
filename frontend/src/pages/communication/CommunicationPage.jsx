import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  getNoticeList, getImportantNotices, getNoticeDetail,
  createNotice, updateNotice, deleteNotice,
} from '../../api/noticeApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Megaphone, Pin, Plus, Pencil, Trash2 } from 'lucide-react';

const CommunicationPage = () => {
  const { roles } = useSelector((s) => s.auth);
  const isAdmin = Array.isArray(roles) && roles.includes('ADMIN');

  const [importantList, setImportantList] = useState([]);
  const [noticeList, setNoticeList]       = useState([]);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [loading, setLoading]             = useState(false);

  const [detailNotice, setDetailNotice]   = useState(null);
  const [showDetail, setShowDetail]       = useState(false);

  const [showForm, setShowForm]           = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formTitle, setFormTitle]         = useState('');
  const [formContent, setFormContent]     = useState('');
  const [formImportant, setFormImportant] = useState(false);
  const [submitting, setSubmitting]       = useState(false);

  const loadList = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const [impRes, listRes] = await Promise.all([getImportantNotices(), getNoticeList(p)]);
      setImportantList(Array.isArray(impRes) ? impRes : []);
      setNoticeList(listRes.content ?? []);
      setTotalPages(listRes.totalPages ?? 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadList(page); }, [page, loadList]);

  const handleRowClick = async (id) => {
    try {
      const data = await getNoticeDetail(id);
      setDetailNotice(data);
      setShowDetail(true);
    } catch (e) { console.error(e); }
  };

  const closeDetail = () => {
    if (detailNotice) {
      const update = (list) => list.map((n) =>
        n.notificationId === detailNotice.notificationId
          ? { ...n, viewCount: detailNotice.viewCount } : n
      );
      setNoticeList((p) => update(p));
      setImportantList((p) => update(p));
    }
    setShowDetail(false);
  };

  const openCreate = () => {
    setEditingNotice(null); setFormTitle(''); setFormContent(''); setFormImportant(false);
    setShowForm(true);
  };

  const openEdit = (notice) => {
    setEditingNotice(notice); setFormTitle(notice.title);
    setFormContent(notice.content); setFormImportant(notice.important);
    closeDetail(); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('공지를 삭제하시겠습니까?')) return;
    try { await deleteNotice(id); setShowDetail(false); loadList(page); }
    catch { alert('삭제에 실패했습니다.'); }
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formContent.trim()) { alert('제목과 내용을 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      if (editingNotice) {
        await updateNotice(editingNotice.notificationId, { title: formTitle, content: formContent, important: formImportant });
      } else {
        await createNotice({ title: formTitle, content: formContent, important: formImportant });
      }
      setShowForm(false); loadList(page);
    } catch { alert('저장에 실패했습니다.'); }
    finally { setSubmitting(false); }
  };

  const formatDate = (s) => s ? s.slice(0, 10) : '';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-zinc-900">공지사항</h2>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={openCreate} className="gap-1.5 cursor-pointer">
            <Plus size={14} /> 공지 등록
          </Button>
        )}
      </div>

      {/* 주요 공지 */}
      {importantList.length > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-100">
            <Pin size={13} className="text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">주요 공지</span>
          </div>
          <table className="w-full">
            <tbody>
              {importantList.map((n) => (
                <tr
                  key={n.notificationId}
                  onClick={() => handleRowClick(n.notificationId)}
                  className="cursor-pointer hover:bg-blue-50 transition-colors border-b border-blue-100 last:border-0"
                >
                  <td className="px-4 py-3 text-sm font-medium text-zinc-800">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100 shrink-0">중요</Badge>
                      {n.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500 w-24 text-center whitespace-nowrap">{n.writer}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 w-16 text-center whitespace-nowrap">{n.viewCount}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 w-28 text-center whitespace-nowrap">{formatDate(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 공지 목록 */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 w-12 text-center whitespace-nowrap">번호</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 text-left">제목</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 w-24 text-center whitespace-nowrap">작성자</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 w-16 text-center whitespace-nowrap">조회수</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 w-28 text-center whitespace-nowrap">작성일</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-zinc-400">불러오는 중...</td></tr>
            ) : noticeList.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-zinc-400">공지사항이 없습니다.</td></tr>
            ) : (
              noticeList.map((n, idx) => (
                <tr
                  key={n.notificationId}
                  onClick={() => handleRowClick(n.notificationId)}
                  className="cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                >
                  <td className="px-4 py-3 text-sm text-zinc-500 text-center whitespace-nowrap">{page * 10 + idx + 1}</td>
                  <td className="px-4 py-3 text-sm text-zinc-800">
                    <div className="flex items-center gap-2">
                      {n.important && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100 shrink-0">중요</Badge>
                      )}
                      {n.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500 text-center whitespace-nowrap">{n.writer}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 text-center whitespace-nowrap">{n.viewCount}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 text-center whitespace-nowrap">{formatDate(n.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-zinc-100">
            <button
              onClick={() => setPage((p) => p - 1)} disabled={page === 0}
              className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >이전</button>
            <span className="text-sm text-zinc-500 min-w-12 text-center">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}
              className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >다음</button>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      <Dialog open={showDetail} onOpenChange={(v) => { if (!v) closeDetail(); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {detailNotice && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  {detailNotice.important && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">중요</Badge>
                  )}
                  <DialogTitle className="text-base">{detailNotice.title}</DialogTitle>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                  <span>{detailNotice.writer}</span>
                  <span>조회 {detailNotice.viewCount}</span>
                  <span>{formatDate(detailNotice.createdAt)}</span>
                </div>
              </DialogHeader>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap mt-2">
                {detailNotice.content}
              </p>
              {isAdmin && (
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-100">
                  <Button variant="outline" size="sm" className="gap-1 cursor-pointer" onClick={() => openEdit(detailNotice)}>
                    <Pencil size={13} /> 수정
                  </Button>
                  <Button variant="destructive" size="sm" className="gap-1 cursor-pointer" onClick={() => handleDelete(detailNotice.notificationId)}>
                    <Trash2 size={13} /> 삭제
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 등록/수정 폼 모달 */}
      <Dialog open={showForm} onOpenChange={(v) => { if (!v) setShowForm(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNotice ? '공지 수정' : '공지 등록'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>제목</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="제목을 입력하세요" maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label>내용</Label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="내용을 입력하세요" rows={8} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formImportant} onChange={(e) => setFormImportant(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-zinc-700">주요 공지로 설정</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="cursor-pointer">취소</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="cursor-pointer">
              {submitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CommunicationPage;
