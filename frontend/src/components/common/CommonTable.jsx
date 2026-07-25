import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CommonTable = ({ columns = [], data = [], onRowClick }) => {
  return (
    <div className="rounded-lg border border-zinc-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className="text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap"
              >
                {col.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item, idx) => (
              <TableRow
                key={item.id ?? idx}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? "cursor-pointer hover:bg-blue-50/50" : ""}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-sm text-zinc-700 py-3">
                    {item[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-sm text-zinc-400 py-12"
              >
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CommonTable;
