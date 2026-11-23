import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3, Download, Search } from 'lucide-react';
import { cn } from './cn';
import Button from './Button';
import Popover from './Popover';
import { EmptyState, ErrorState, Skeleton } from './Feedback';

export interface Column<T> {
  key: string;
  header: string;
  /** Plain value, used for sorting and CSV export when sortValue and exportValue are not set. */
  accessor?: (row: T) => string | number | boolean | null | undefined;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string;
  align?: 'left' | 'right' | 'center';
  /** Start hidden. The user can show it from the Columns menu. */
  defaultHidden?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  /** Names the table for screen readers. */
  caption: string;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Text matched by the search box. Omit to hide the search box. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  /** Filter controls. State lives in the parent, the parent passes already filtered rows. */
  filters?: ReactNode;
  toolbarExtra?: ReactNode;
  pageSize?: number;
  selectable?: boolean;
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  rowActions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** File name without extension. Setting this shows the Export CSV button. Only pass it when the user may export. */
  exportName?: string;
  columnToggle?: boolean;
  initialSort?: { key: string; direction: 'asc' | 'desc' };
}

function toCsvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value; // stops spreadsheet formula injection
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function Pagination({ page, pageCount, total, pageSize, onPage }: { page: number; pageCount: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages: Array<number | 'gap'> = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
  }
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-warm-200 px-4 py-3 text-sm">
      <p className="text-charcoal-600" aria-live="polite">
        Showing {from} to {to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page" icon={<ChevronLeft size={16} aria-hidden="true" />} />
        {pages.map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="px-2 text-charcoal-500" aria-hidden="true">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              className={cn('h-8 min-w-8 rounded-lg px-2 text-sm', item === page ? 'bg-primary-700 text-white' : 'text-charcoal-700 hover:bg-warm-100')}
            >
              {item}
            </button>
          ),
        )}
        <Button size="sm" onClick={() => onPage(page + 1)} disabled={page >= pageCount} aria-label="Next page" icon={<ChevronRight size={16} aria-hidden="true" />} />
      </div>
    </nav>
  );
}

/**
 * Table with search, sort, pagination, selection, column menu and CSV export.
 * It shows loading, error and empty states itself. Filters stay in the parent.
 */
export default function DataTable<T>({
  caption,
  rows,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = 'Search',
  filters,
  toolbarExtra,
  pageSize = 10,
  selectable = false,
  bulkActions,
  rowActions,
  onRowClick,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  exportName,
  columnToggle = true,
  initialSort,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(initialSort ?? null);
  const [pageState, setPageState] = useState({ page: 1, key: '' });
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter((column) => column.defaultHidden).map((column) => column.key)));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visibleColumns = columns.filter((column) => !hidden.has(column.key));

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text || !searchText) return rows;
    return rows.filter((row) => searchText(row).toLowerCase().includes(text));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((candidate) => candidate.key === sort.key);
    if (!column) return filtered;
    const read = (row: T): string | number => {
      if (column.sortValue) return column.sortValue(row);
      const value = column.accessor?.(row);
      return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
    };
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = read(a);
      const right = read(b);
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction;
      return String(left).localeCompare(String(right), undefined, { numeric: true }) * direction;
    });
  }, [filtered, sort, columns]);

  // The page goes back to 1 when the search text or the number of rows changes.
  const resetKey = `${query}|${rows.length}`;
  const page = pageState.key === resetKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ page: next, key: resetKey });
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);


  const toggleSort = (key: string) =>
    setSort((previous) => (previous?.key === key ? (previous.direction === 'asc' ? { key, direction: 'desc' } : null) : { key, direction: 'asc' }));

  const allOnPage = pageRows.length > 0 && pageRows.every((row) => selected.has(rowKey(row)));
  const someOnPage = pageRows.some((row) => selected.has(rowKey(row)));
  // Rows that were removed since they were selected simply drop out here.
  const selectedRows = rows.filter((row) => selected.has(rowKey(row)));
  const clearSelection = () => setSelected(new Set());

  const exportCsv = () => {
    const head = visibleColumns.map((column) => toCsvCell(column.header)).join(',');
    const body = sorted.map((row) =>
      visibleColumns
        .map((column) => toCsvCell(column.exportValue ? column.exportValue(row) : String(column.accessor?.(row) ?? '')))
        .join(','),
    );
    const blob = new Blob([[head, ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const colSpan = visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const hasToolbar = Boolean(searchText || filters || toolbarExtra || exportName || (columnToggle && columns.length > 3));

  return (
    <div className="overflow-hidden rounded-2xl border border-warm-200 bg-white">
      {hasToolbar && (
        <div className="flex flex-wrap items-end gap-3 border-b border-warm-200 p-3 md:p-4">
          {searchText && (
            <div className="relative min-w-[12rem] flex-1 sm:max-w-sm">
              <label htmlFor={`search-${caption}`} className="sr-only">
                {searchPlaceholder}
              </label>
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" aria-hidden="true" />
              <input
                id={`search-${caption}`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
                className="input pl-10"
              />
            </div>
          )}
          {filters}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {toolbarExtra}
            {columnToggle && columns.length > 3 && (
              <Popover
                label="Choose columns"
                align="right"
                trigger={(props) => (
                  <Button {...props} size="sm" icon={<Columns3 size={16} aria-hidden="true" />}>
                    Columns
                  </Button>
                )}
              >
                {() => (
                  <fieldset className="space-y-1 p-2">
                    <legend className="mb-1 text-xs font-semibold uppercase text-charcoal-500">Show columns</legend>
                    {columns.map((column) => (
                      <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-warm-50">
                        <input
                          type="checkbox"
                          checked={!hidden.has(column.key)}
                          onChange={() =>
                            setHidden((previous) => {
                              const next = new Set(previous);
                              if (next.has(column.key)) next.delete(column.key);
                              else if (visibleColumns.length > 1) next.add(column.key);
                              return next;
                            })
                          }
                          className="accent-primary-700"
                        />
                        {column.header}
                      </label>
                    ))}
                  </fieldset>
                )}
              </Popover>
            )}
            {exportName && (
              <Button size="sm" onClick={exportCsv} disabled={sorted.length === 0} icon={<Download size={16} aria-hidden="true" />}>
                Export CSV
              </Button>
            )}
          </div>
        </div>
      )}

      {selectable && selectedRows.length > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-3 border-b border-primary-200 bg-primary-50 px-4 py-2 text-sm">
          <span className="font-medium text-primary-900">{selectedRows.length} selected</span>
          {bulkActions?.(selectedRows, clearSelection)}
          <button type="button" onClick={clearSelection} className="ml-auto text-primary-700 hover:underline">
            Clear selection
          </button>
        </div>
      )}

      {error ? (
        <div className="p-4">
          <ErrorState title="Could not load this list" description={error} onRetry={onRetry} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">{caption}</caption>
            <thead className="border-b border-warm-200 bg-warm-50">
              <tr>
                {selectable && (
                  <th scope="col" className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all rows on this page"
                      checked={allOnPage}
                      ref={(node) => {
                        if (node) node.indeterminate = !allOnPage && someOnPage;
                      }}
                      onChange={() =>
                        setSelected((previous) => {
                          const next = new Set(previous);
                          pageRows.forEach((row) => (allOnPage ? next.delete(rowKey(row)) : next.add(rowKey(row))));
                          return next;
                        })
                      }
                      className="accent-primary-700"
                    />
                  </th>
                )}
                {visibleColumns.map((column) => {
                  const active = sort?.key === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : column.sortable ? 'none' : undefined}
                      className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-700', column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left', column.className)}
                    >
                      {column.sortable ? (
                        <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 uppercase hover:text-charcoal-950">
                          {column.header}
                          {active ? sort?.direction === 'asc' ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" /> : <ArrowUpDown size={14} className="text-charcoal-400" aria-hidden="true" />}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
                {rowActions && (
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-charcoal-700">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-200">
              {loading &&
                [0, 1, 2, 3, 4].map((index) => (
                  <tr key={`sk-${index}`} aria-hidden="true">
                    <td colSpan={colSpan} className="px-4 py-3">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="p-4">
                    {rows.length === 0 ? (
                      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                    ) : (
                      <EmptyState
                        title="No results"
                        description="Nothing matches the search or filters."
                        action={query ? <Button onClick={() => setQuery('')}>Clear search</Button> : undefined}
                      />
                    )}
                  </td>
                </tr>
              )}
              {!loading &&
                pageRows.map((row) => {
                  const key = rowKey(row);
                  const isSelected = selected.has(key);
                  return (
                    <tr
                      key={key}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      aria-selected={selectable ? isSelected : undefined}
                      className={cn('transition-colors hover:bg-warm-50', isSelected && 'bg-primary-50/60', onRowClick && 'cursor-pointer')}
                    >
                      {selectable && (
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select row ${key}`}
                            checked={isSelected}
                            onChange={() =>
                              setSelected((previous) => {
                                const next = new Set(previous);
                                if (next.has(key)) next.delete(key);
                                else next.add(key);
                                return next;
                              })
                            }
                            className="accent-primary-700"
                          />
                        </td>
                      )}
                      {visibleColumns.map((column) => (
                        <td key={column.key} className={cn('px-4 py-3 text-sm text-charcoal-800', column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left', column.className)}>
                          {column.cell ? column.cell(row) : String(column.accessor?.(row) ?? '')}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                          <div className="flex justify-end gap-1">{rowActions(row)}</div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {!error && !loading && <Pagination page={current} pageCount={pageCount} total={sorted.length} pageSize={pageSize} onPage={setPage} />}
    </div>
  );
}
