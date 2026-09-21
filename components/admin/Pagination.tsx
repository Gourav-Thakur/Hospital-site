"use client";

export default function Pagination({
  page, pageSize, total, onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between gap-4 mt-4 text-sm">
      <span className="text-muted">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-app font-semibold disabled:opacity-40 hover:border-medical-deepteal"
        >
          Prev
        </button>
        <span className="text-muted">Page {page} of {pages}</span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 rounded-lg border border-app font-semibold disabled:opacity-40 hover:border-medical-deepteal"
        >
          Next
        </button>
      </div>
    </div>
  );
}
