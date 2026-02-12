import { memo } from "react";
import { useAssayStore } from "../features/hooks"; // Zustand store

const COLS = Array.from({ length: 12 }, (_, i) => i + 1);
const ROWS = ["A","B","C","D","E","F","G","H"];

// Helper function to get heat map color (green -> yellow -> red)
const getHeatMapColor = (value: number, min: number, max: number): string => {
  if (!isFinite(value) || min === max) {
    return 'rgb(243, 244, 246)' // gray-100
  }
  
  // Normalize value to 0-1 range
  const normalized = (value - min) / (max - min)
  
  // Green (low) -> Yellow (middle) -> Red (high)
  // Green: RGB(34, 197, 94) = #22c55e
  // Yellow: RGB(234, 179, 8) = #eab308
  // Red: RGB(239, 68, 68) = #ef4444
  
  let r: number, g: number, b: number
  
  if (normalized < 0.5) {
    // Green to Yellow
    const t = normalized * 2 // 0 to 1
    r = Math.round(34 + (234 - 34) * t)
    g = Math.round(197 + (179 - 197) * t)
    b = Math.round(94 + (8 - 94) * t)
  } else {
    // Yellow to Red
    const t = (normalized - 0.5) * 2 // 0 to 1
    r = Math.round(234 + (239 - 234) * t)
    g = Math.round(179 + (68 - 179) * t)
    b = Math.round(8 + (68 - 8) * t)
  }
  
  return `rgb(${r}, ${g}, ${b})`
}

const PlateResultsGrid = memo(() => {
  const results = useAssayStore(s => s.results);
  const sigDigits = useAssayStore(s => s.sigDigits);
  const incDigits = useAssayStore(s => s.incDigits);
  const decDigits = useAssayStore(s => s.decDigits);
  // Map results to a lookup table for O(1) access
  const resultMap = Object.fromEntries(results.map(r => [r.wellId, r.isValid ? r.value : NaN])) as Record<string, number>;
  const hasData = results.length > 0;
  
  // Calculate min/max for heat map
  const validValues = results.filter(r => r.isValid && isFinite(r.value)).map(r => r.value)
  const minValue = validValues.length > 0 ? Math.min(...validValues) : 0
  const maxValue = validValues.length > 0 ? Math.max(...validValues) : 1
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6 w-full max-w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Results Table</h3>
        <div className="flex items-center space-x-1 text-sm">
          <button
            onClick={decDigits}
            className="px-1 rounded bg-gray-200 hover:bg-gray-300 text-xs"
            aria-label="Decrease significant digits"
          >−</button>
          <span 
            className="text-gray-500 cursor-help" 
            title="Decimal Point"
          >
            {sigDigits} dp
          </span>
          <button
            onClick={incDigits}
            className="px-1 rounded bg-gray-200 hover:bg-gray-300 text-xs"
            aria-label="Increase significant digits"
          >+</button>
        </div>
      </div>
      {hasData ? (
        <div className="overflow-auto">
          <table className="border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="w-8 sticky left-0 bg-white"></th>
                {COLS.map(c => (
                  <th key={c} className="w-8 px-1 text-center font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(r => (
                <tr key={r}>
                  <th className="sticky left-0 bg-white font-medium">{r}</th>
                  {COLS.map(c => {
                    const id = `${r}${c}`;         // e.g. A1
                    const val = resultMap[id];
                    const isValid = Number.isFinite(val);
                    const bgColor = isValid ? getHeatMapColor(val, minValue, maxValue) : 'rgb(243, 244, 246)';
                    
                    return (
                      <td
                        key={id}
                        style={{ backgroundColor: bgColor }}
                        className={`h-6 w-8 text-center border border-gray-300 ${
                          isValid ? "text-gray-900 font-medium" : "text-gray-400"
                        }`}
                      >
                        {isValid ? val.toFixed(sigDigits) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12 text-lg">No results yet. Paste data and calculate to see results.</div>
      )}
    </div>
  );
});

export default PlateResultsGrid; 