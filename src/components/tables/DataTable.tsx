"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Settings2, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  pageCount?: number;
  totalCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onGlobalFilterChange?: (value: string) => void;
  globalFilterValue?: string;
  searchPlaceholder?: string;
  showRowSelection?: boolean;
  entityName?: string;
  onFilterClick?: () => void;
  activeFiltersCount?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  pageCount = 1,
  totalCount,
  pagination,
  onPaginationChange,
  onGlobalFilterChange,
  globalFilterValue = "",
  searchPlaceholder = "Search...",
  showRowSelection = false,
  entityName = "records",
  onFilterClick,
  activeFiltersCount = 0,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [searchValue, setSearchValue] = React.useState(globalFilterValue);

  React.useEffect(() => {
    setSearchValue(globalFilterValue);
  }, [globalFilterValue]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== globalFilterValue) {
        onGlobalFilterChange?.(searchValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onGlobalFilterChange, globalFilterValue]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    manualPagination: true,
    pageCount: pageCount,
  });

  return (
    <div className="w-full space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/50 dark:bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="relative flex-1 w-full max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-12 h-12 bg-gray-50/50 dark:bg-black/20 border-none rounded-[16px] focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 shadow-inner"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={onFilterClick}
            className={cn(
              "h-12 px-6 border-gray-100 dark:border-white/10 rounded-[16px] gap-2 font-semibold transition-all shadow-sm relative overflow-visible cursor-pointer",
              activeFiltersCount > 0
                ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
            )}
          >
            <Filter className="h-4 w-4" />
            Filter
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-md shadow-primary/20 animate-in zoom-in duration-300">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="h-12 px-6 border-gray-100 dark:border-white/10 rounded-[16px] gap-2 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm">
                  <Settings2 className="h-4 w-4" />
                  Columns
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Toggle Columns</div>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize rounded-xl font-medium text-sm my-1 focus:bg-primary/10 focus:text-primary"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace("_", " ")}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Body */}
      <div className="rounded-[24px] border border-gray-100 dark:border-white/5 overflow-hidden bg-white/50 dark:bg-black/5 backdrop-blur-xl shadow-md shadow-gray-100/10">
        <Table>
          <TableHeader className="bg-primary/[0.02] dark:bg-primary/[0.04] border-b border-primary/10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-16 text-primary/90 dark:text-primary/90 font-bold uppercase tracking-[0.12em] text-[12px] px-8">
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center gap-2 cursor-pointer select-none hover:text-primary transition-colors group/head"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col text-gray-300 dark:text-gray-600 transition-colors group-hover/head:text-primary">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronRight className="h-3 w-3 -rotate-90 text-primary" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronRight className="h-3 w-3 rotate-90 text-primary" />
                            ) : (
                              <div className="flex flex-col gap-0.5 opacity-40 group-hover/head:opacity-100">
                                <ChevronRight className="h-2 w-2 -rotate-90" />
                                <ChevronRight className="h-2 w-2 rotate-90" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                  {columns.map((_, j) => (
                    <TableCell key={j} className="px-8 py-6">
                      <Skeleton className="h-6 w-full rounded-xl" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-primary/[0.015] dark:hover:bg-primary/[0.035] transition-all duration-300 group/row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-8 py-5 transition-all duration-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[450px] text-center border-none hover:bg-transparent">
                  <EmptyState 
                    title="No records found" 
                    description="It seems there are no team members in the database yet. Try adding a new user to get started."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-4 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm transition-all">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-primary/70 animate-pulse" />
          <div className="text-sm text-gray-500 font-semibold tracking-wide">
            {showRowSelection ? (
              <>
                Selected <span className="text-primary font-bold">{table.getFilteredSelectedRowModel().rows.length}</span> of{" "}
                <span className="text-gray-900 dark:text-white font-bold">{totalCount ?? table.getFilteredRowModel().rows.length}</span> {entityName}
              </>
            ) : (
              <>
                Total <span className="text-primary font-bold">{totalCount ?? table.getFilteredRowModel().rows.length}</span> {entityName}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-3">
            <p className="text-[11px] font-semibold text-primary/80 dark:text-primary/90 uppercase tracking-[0.12em]">Rows per page</p>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="h-10 w-20 rounded-xl border border-gray-100 dark:border-white/10 bg-white/80 dark:bg-gray-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all cursor-pointer px-3 shadow-sm flex items-center justify-between gap-1.5 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <span>{table.getState().pagination.pageSize}</span>
                    <ChevronRight className="h-4 w-4 rotate-90 text-gray-400" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-20 rounded-xl p-1.5 border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90">
                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <DropdownMenuItem
                    key={pageSize}
                    className="capitalize rounded-lg font-semibold text-xs my-0.5 focus:bg-primary/10 focus:text-primary cursor-pointer text-center justify-center py-2 transition-colors"
                    onClick={() => {
                      table.setPageSize(pageSize);
                      onPaginationChange?.({
                        pageIndex: 0,
                        pageSize: pageSize,
                      });
                    }}
                  >
                    {pageSize}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-semibold text-primary bg-primary/5 px-4 py-2.5 rounded-xl border border-primary/10 tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
              <span className="text-primary/60 font-medium tracking-normal">PAGE</span> 
              <span>{table.getState().pagination.pageIndex + 1}</span> 
              <span className="text-primary/60 font-medium tracking-normal">OF</span> 
              <span>{pageCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-10 w-10 p-0 rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 text-primary hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:hover:border-gray-100 shadow-sm hover:scale-105 active:scale-95 transition-all"
                onClick={() => {
                  const newIndex = table.getState().pagination.pageIndex - 1;
                  table.previousPage();
                  onPaginationChange?.({
                    pageIndex: newIndex,
                    pageSize: table.getState().pagination.pageSize,
                    });
                  }}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="h-10 w-10 p-0 rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 text-primary hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:hover:border-gray-100 shadow-sm hover:scale-105 active:scale-95 transition-all"
                onClick={() => {
                  const newIndex = table.getState().pagination.pageIndex + 1;
                  table.nextPage();
                  onPaginationChange?.({
                    pageIndex: newIndex,
                    pageSize: table.getState().pagination.pageSize,
                  });
                }}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
