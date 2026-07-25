import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const SearchBar = ({ value, onChange, onSearch, placeholder, showButton = true }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) onSearch();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-8 w-64"
        />
      </div>
      {showButton && (
        <Button type="button" variant="outline" size="sm" onClick={onSearch} className="cursor-pointer">
          검색
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
