import { memo } from 'react';
import Skeleton from './Skeleton';

/**
 * TableSkeleton
 * Matches Admin tables (Products, Orders, Users) with accurate column structure and row count.
 */
const TableSkeleton = ({
  rows = 5,
  columns,
  cols,
  colWidths = ['w-24', 'w-44', 'w-24', 'w-20', 'w-16'],
  className = '',
}) => {
  const colCount = cols || columns || 5;
  return (
    <div
      aria-hidden="true"
      className={`bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead className="bg-slate-50 border-b border-slate-200/80">
            <tr>
              {Array.from({ length: colCount }).map((_, colIdx) => (
                <th key={colIdx} className="px-6 py-4">
                  <Skeleton
                    variant="rounded"
                    className={`h-3.5 ${colWidths[colIdx % colWidths.length] || 'w-20'}`}
                  />
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                {Array.from({ length: colCount }).map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    <Skeleton
                      variant="rounded"
                      className={`h-4 ${
                        colIdx === 0
                          ? 'w-12'
                          : colIdx === 1
                          ? 'w-36'
                          : colWidths[colIdx % colWidths.length] || 'w-24'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(TableSkeleton);
