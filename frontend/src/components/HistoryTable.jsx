/**
 * HistoryTable — A styled table for movement and order history.
 *
 * Props:
 *   columns  — Array of { key, label }
 *   data     — Array of row objects
 *   caption  — Optional heading
 */

const typeColors = {
  Incoming:           'bg-emerald-600/25 text-emerald-400',
  Outgoing:           'bg-red-600/25 text-red-400',
  Moving:             'bg-blue-600/25 text-blue-400',
  'Purchase Order':   'bg-indigo-600/25 text-indigo-400',
  'Sales Order':      'bg-amber-600/25 text-amber-400',
}

const statusColors = {
  Completed:  'bg-emerald-600/25 text-emerald-400',
  'In Transit': 'bg-blue-600/25 text-blue-400',
  Pending:    'bg-amber-600/25 text-amber-400',
  Received:   'bg-emerald-600/25 text-emerald-400',
  Fulfilled:  'bg-emerald-600/25 text-emerald-400',
  Ordered:    'bg-indigo-600/25 text-indigo-400',
  Canceled:   'bg-red-600/25 text-red-400',
}

function Badge({ value, colorMap }) {
  const cls = colorMap[value] || 'bg-gray-600/30 text-gray-300'
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {value}
    </span>
  )
}

export default function HistoryTable({ columns = [], data = [], caption }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {caption && (
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{caption}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-800/60">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                  {columns.map((col) => {
                    const val = row[col.key]
                    // Render badges for type and status columns
                    if (col.key === 'type') {
                      return <td key={col.key} className="px-6 py-4 whitespace-nowrap"><Badge value={val} colorMap={typeColors} /></td>
                    }
                    if (col.key === 'status') {
                      return <td key={col.key} className="px-6 py-4 whitespace-nowrap"><Badge value={val} colorMap={statusColors} /></td>
                    }
                    return (
                      <td key={col.key} className="px-6 py-4 text-gray-300 whitespace-nowrap">
                        {val ?? '—'}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-800 text-xs text-gray-500">
          Showing {data.length} {data.length === 1 ? 'record' : 'records'}
        </div>
      )}
    </div>
  )
}
