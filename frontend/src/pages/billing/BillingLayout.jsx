import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BillingList from './component/BillingList';
import PaymentList from './component/PaymentList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Receipt } from 'lucide-react';

const BillingLayout = () => {
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();

  const accessToken = sessionStorage.getItem('accessToken');
  const roles = sessionStorage.getItem("roles");

  useEffect(() => {
    if (!accessToken) { navigate("/login", { replace: true }); return; }
    if (roles && !roles.includes("ADMIN")) { navigate("/my-schedule", { replace: true }); }
  }, []);

  const handleSearch = () => setKeyword(searchInput.trim());

  return (
    <div className="p-6 space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Receipt size={20} className="text-blue-600" />
        <h1 className="text-lg font-bold text-zinc-900">수납</h1>
      </div>

      {/* 검색 */}
      <div className="flex gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-8 w-72"
            placeholder="접수 번호 또는 환자 이름으로 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
        </div>
        <Button variant="outline" onClick={handleSearch} className="cursor-pointer">검색</Button>
      </div>

      {/* 청구/결제 내역 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BillingList keyword={keyword} />
        <PaymentList keyword={keyword} />
      </div>
    </div>
  );
};

export default BillingLayout;
