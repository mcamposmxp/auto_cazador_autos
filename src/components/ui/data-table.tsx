import { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination-custom";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    showSizeChanger?: boolean;
    onChange: (page: number, pageSize?: number) => void;
  };
  rowKey?: keyof T | string;
  emptyText?: string;
  className?: string;
}

export const DataTable = memo(function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  rowKey = 'id',
  emptyText = 'No hay datos disponibles',
  className
}: DataTableProps<T>) {
  
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'string' && rowKey in record) {
      return String(record[rowKey]);
    }
    return String(index);
  };

  const renderCell = (column: Column<T>, record: T, index: number) => {
    if (column.render) {
      return column.render(record[column.key as keyof T], record, index);
    }
    
    return record[column.key as keyof T];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={String(column.key) + index}
                  style={{ width: column.width }}
                  className={column.align ? `text-${column.align}` : ''}
                >
                  {column.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              data.map((record, index) => (
                <TableRow key={getRowKey(record, index)}>
                  {columns.map((column, colIndex) => (
                    <TableCell 
                      key={String(column.key) + colIndex}
                      className={column.align ? `text-${column.align}` : ''}
                    >
                      {renderCell(column, record, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.current}
          totalPages={Math.ceil(pagination.total / pagination.pageSize)}
          onPageChange={(page) => pagination.onChange(page)}
          showSizeChanger={pagination.showSizeChanger}
          pageSize={pagination.pageSize}
          onPageSizeChange={(size) => pagination.onChange(1, size)}
        />
      )}
    </div>
  );
}) as <T extends Record<string, any>>(props: DataTableProps<T>) => JSX.Element;