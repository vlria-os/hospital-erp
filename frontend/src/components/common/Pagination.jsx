import { cn } from "@/lib/utils";

const Pagination = ({ page, totalPages, onPageChange, variant = "default" }) => {
  if (totalPages <= 1) return null;

  const isSub = variant === "sub";

  return (
    <div className={cn(
      "flex items-center gap-2",
      isSub ? "justify-end mt-1.5" : "justify-center mt-4"
    )}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className={cn(
          "rounded border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
          isSub
            ? "text-[11px] px-2.5 h-6 border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            : "text-sm px-4 h-8 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        )}
      >
        이전
      </button>

      <span className={cn(
        "font-semibold text-zinc-500 min-w-12 text-center",
        isSub ? "text-[11px]" : "text-sm"
      )}>
        {page + 1} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className={cn(
          "rounded border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
          isSub
            ? "text-[11px] px-2.5 h-6 border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            : "text-sm px-4 h-8 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        )}
      >
        다음
      </button>
    </div>
  );
};

export default Pagination;
