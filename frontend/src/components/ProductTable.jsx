/**
 * ProductTable — A reusable, styled data table.
 *
 * Props:
 *   columns  — Array of { key: string, label: string }
 *   data     — Array of row objects whose keys match column.key
 *   caption  — Optional table caption / title shown above the grid
 */
export default function ProductTable({ columns = [], data = [], caption }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {caption && (
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{caption}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          {/* Head */}
          <thead>
            <tr className="bg-gray-800/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-800">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-800/40 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-gray-300 whitespace-nowrap"
                    >
                      {row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer row count */}
      {data.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-800 text-xs text-gray-500">
          Showing {data.length} {data.length === 1 ? 'record' : 'records'}
        </div>
      )}
    </div>
  )
}
