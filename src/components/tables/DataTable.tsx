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
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Settings2, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onGlobalFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  pageCount = 1,
  pagination,
  onPaginationChange,
  onGlobalFilterChange,
  searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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
            onChange={(event) => onGlobalFilterChange?.(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="h-12 px-6 border-gray-100 dark:border-white/10 rounded-[16px] gap-2 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="h-12 px-6 border-gray-100 dark:border-white/10 rounded-[16px] gap-2 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm">
                  <Settings2 className="h-4 w-4" />
                  Columns
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-gray-100 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90">
              <div className="px-2 py-1.5 text-xs font-black text-gray-400 uppercase tracking-widest">Toggle Columns</div>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize rounded-xl font-bold text-sm my-1 focus:bg-primary/10 focus:text-primary"
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
      <div className="rounded-[32px] overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-16 text-gray-400 font-black uppercase tracking-[0.15em] text-[11px] px-8">
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
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all duration-300 group/row"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-4 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="text-sm text-gray-500 font-bold">
          <span className="text-primary">{table.getFilteredSelectedRowModel().rows.length}</span> of{" "}
          <span className="text-gray-900 dark:text-white">{table.getFilteredRowModel().rows.length}</span> rows selected
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-3">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Rows per page</p>
            <select
              className="h-10 w-20 rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer px-3"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
                onPaginationChange?.({
                  pageIndex: 0,
                  pageSize: Number(e.target.value),
                });
              }}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5">
              <span className="text-gray-400 mr-1">PAGE</span> {table.getState().pagination.pageIndex + 1} <span className="text-gray-400 mx-1">OF</span> {pageCount}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-10 w-10 p-0 rounded-xl border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm hover:scale-105 active:scale-95 transition-all"
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
                className="h-10 w-10 p-0 rounded-xl border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm hover:scale-105 active:scale-95 transition-all"
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
