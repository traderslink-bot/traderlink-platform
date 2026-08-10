"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export const TRADE_ANALYZER_PAGE_SIZES = Object.freeze([10, 25, 50, 100] as const);

export function boundedPage(page: number, rowCount: number, pageSize: number): number {
  const lastPage = Math.max(1, Math.ceil(rowCount / pageSize));
  return Math.min(Math.max(1, page), lastPage);
}

export function paginatedRows<T>(rows: readonly T[], page: number, pageSize: number): readonly T[] {
  const currentPage = boundedPage(page, rows.length, pageSize);
  const start = (currentPage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function TradeAnalyzerTablePagination({
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  rowCount,
}: {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  rowCount: number;
}) {
  if (rowCount <= 10) return null;
  const currentPage = boundedPage(page, rowCount, pageSize);
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, rowCount);
  const lastPage = Math.max(1, Math.ceil(rowCount / pageSize));
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
    >
      <Typography color="text.secondary" variant="body2">
        Showing {start}-{end} of {rowCount}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          label="Results per page"
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          select
          size="small"
          value={pageSize}
        >
          {TRADE_ANALYZER_PAGE_SIZES.map((size) => (
            <MenuItem key={size} value={size}>{size}</MenuItem>
          ))}
        </TextField>
        <Button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} size="small" variant="outlined">
          Previous
        </Button>
        <Button disabled={currentPage >= lastPage} onClick={() => onPageChange(currentPage + 1)} size="small" variant="outlined">
          Next
        </Button>
      </Stack>
    </Stack>
  );
}
