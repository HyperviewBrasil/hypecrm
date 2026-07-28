import React from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
}

export default function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage = 'Nenhum registro encontrado',
  rowClassName,
}: ResponsiveTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-400">
        Carregando...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  // Desktop view - Table
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block w-full overflow-hidden rounded-lg border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-700/50 border-b border-gray-700/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left font-semibold text-gray-300 ${col.className || ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-gray-700/30 transition-colors duration-200 ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${rowClassName?.(row) || ''}`}
              >
                {columns.map((col) => {
                  const value = String(col.key).includes('.')
                    ? String(col.key).split('.').reduce((obj: any, key) => obj?.[key], row)
                    : (row as any)[col.key];

                  return (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 text-gray-200 ${col.className || ''}`}
                    >
                      {col.render ? col.render(value, row) : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => (
          <div
            key={keyExtractor(row, index)}
            onClick={() => onRowClick?.(row)}
            className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors duration-200 ${
              onRowClick ? 'cursor-pointer' : ''
            } ${rowClassName?.(row) || ''}`}
          >
            <div className="space-y-2">
              {columns.map((col) => {
                const value = String(col.key).includes('.')
                  ? String(col.key).split('.').reduce((obj: any, key) => obj?.[key], row)
                  : (row as any)[col.key];

                return (
                  <div key={String(col.key)} className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-gray-400 text-sm flex-shrink-0">
                      {col.label}:
                    </span>
                    <span className={`text-gray-200 text-right flex-1 ${col.className || ''}`}>
                      {col.render ? col.render(value, row) : value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
