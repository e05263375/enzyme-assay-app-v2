import React, { useMemo } from 'react'
import { ChartJsSparkline } from './ChartJsSparkline'
import type { WellData } from '../features/hooks'

interface WellSparklineGridProps {
  rawData: WellData[]
  selected: Set<string>
  onChange: (wellId: string) => void
  control0Wells?: Set<string>
  control100Wells?: Set<string>
  mode: 'wells' | 'combined'
}

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const COLS = Array.from({ length: 12 }, (_, i) => i + 1)

const PASTEL = {
  sample: '#e9d5ff',
  control0: '#bfdbfe',
  control100: '#bbf7d0'
} as const

function getWellData(rawData: WellData[], wellId: string): number[] {
  let id = wellId
  if (/^[A-H]0[1-9]$/.test(wellId)) {
    id = wellId.charAt(0) + wellId.slice(2)
  }
  const found = rawData.find(well => well.wellId === id)
  return found?.timePoints || []
}

/** Get display colour from assignment only (not from current tab). No reinitialisation when switching Sample / 0% / 100% tab. */
function getAssignmentPastel(
  wellId: string,
  selected: Set<string>,
  control0Wells: Set<string>,
  control100Wells: Set<string>,
  mode: 'wells' | 'combined'
): string | undefined {
  if (mode === 'wells') {
    return selected.has(wellId) ? PASTEL.sample : undefined
  }
  if (control0Wells.has(wellId)) return PASTEL.control0
  if (control100Wells.has(wellId)) return PASTEL.control100
  if (selected.has(wellId)) return PASTEL.sample
  return undefined
}

export const WellSparklineGrid: React.FC<WellSparklineGridProps> = ({
  rawData,
  selected,
  onChange,
  control0Wells = new Set(),
  control100Wells = new Set(),
  mode
}) => {
  const globalYDomain = useMemo((): [number, number] => {
    if (rawData.length === 0) return [0, 1]
    let globalMaxY = 0
    let globalMinY = Number.POSITIVE_INFINITY
    for (const well of rawData) {
      for (let i = 0; i < well.timePoints.length; i++) {
        if (well.timePoints[i] > globalMaxY) globalMaxY = well.timePoints[i]
        if (well.timePoints[i] < globalMinY) globalMinY = well.timePoints[i]
      }
    }
    if (globalMaxY <= 0) globalMaxY = 1
    if (!isFinite(globalMinY) || globalMinY < 0) globalMinY = 0
    const padding = (globalMaxY - globalMinY) * 0.1
    return [globalMinY - padding, globalMaxY + padding]
  }, [rawData])

  const cellWidth = 52
  const cellHeight = 38

  return (
    <div className="space-y-4">
      <div
        className="grid gap-0 w-full max-w-full overflow-hidden"
        style={{
          gridTemplateColumns: `28px repeat(12, ${cellWidth}px)`,
          width: 'fit-content',
          maxWidth: '100%'
        }}
      >
        <div className="h-6 flex-shrink-0" />
        {COLS.map(col => (
          <div
            key={col}
            className="h-6 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0"
          >
            {col}
          </div>
        ))}
        {ROWS.map(row => (
          <React.Fragment key={row}>
            <div
              className="flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0"
              style={{ height: cellHeight, minHeight: cellHeight }}
            >
              {row}
            </div>
            {COLS.map(col => {
              const wellId = `${row}${col}`
              const data = getWellData(rawData, wellId)
              const pastel = getAssignmentPastel(wellId, selected, control0Wells, control100Wells, mode)
              const isSelected = !!pastel

              if (data.length === 0) {
                return (
                  <div
                    key={wellId}
                    className="flex items-center justify-center border border-gray-200 rounded bg-gray-50 flex-shrink-0"
                    style={{
                      width: cellWidth,
                      minWidth: cellWidth,
                      height: cellHeight,
                      minHeight: cellHeight
                    }}
                  >
                    <span className="text-[10px] text-gray-400">-</span>
                  </div>
                )
              }

              return (
                <div
                  key={wellId}
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: cellWidth,
                    minWidth: cellWidth,
                    height: cellHeight,
                    minHeight: cellHeight
                  }}
                >
                  <ChartJsSparkline
                    data={data}
                    width={cellWidth}
                    height={cellHeight}
                    color="#6b7280"
                    isSelected={isSelected}
                    onClick={() => onChange(wellId)}
                    xDomain={data.length > 0 ? data.length - 1 : 1}
                    yDomain={globalYDomain}
                    static
                    selectionPastelColor={pastel}
                  />
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      {mode === 'combined' && (
        <div className="text-sm text-gray-600 space-y-1">
          <p className="flex items-center gap-2">
            <span className="w-3 h-3 rounded border flex-shrink-0" style={{ backgroundColor: PASTEL.sample }} />
            Sample Wells: {selected.size - control0Wells.size - control100Wells.size}
          </p>
          <p className="flex items-center gap-2">
            <span className="w-3 h-3 rounded border flex-shrink-0" style={{ backgroundColor: PASTEL.control0 }} />
            0% Control: {control0Wells.size}
          </p>
          <p className="flex items-center gap-2">
            <span className="w-3 h-3 rounded border flex-shrink-0" style={{ backgroundColor: PASTEL.control100 }} />
            100% Control: {control100Wells.size}
          </p>
        </div>
      )}
      {mode === 'wells' && <p className="text-sm text-gray-600">Selected: {selected.size} wells</p>}
    </div>
  )
}
