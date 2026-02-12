import React, { useState } from 'react'
import { ChartJsSparkline } from './ChartJsSparkline'
import { useAssayStore } from '../features/hooks'

interface PlotAreaProps {
  /** When true, use smaller cells so full 8x12 grid fits without vertical scroll */
  compact?: boolean
}

export const PlotArea: React.FC<PlotAreaProps> = ({ compact = false }) => {
  const { rawData, selectedWells, results, setSelectedWells } = useAssayStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const cols = Array.from({ length: 12 }, (_, i) => i + 1)

  const getWellData = (wellId: string) => {
    // 兼容A01和A1格式，统一转换为A1格式
    let id = wellId
    if (/^[A-H]0[1-9]$/.test(wellId)) {
      id = wellId.charAt(0) + wellId.slice(2)
    }
    const found = rawData.find(well => well.wellId === id)
    return found?.timePoints || []
  }

  const getWellColor = (wellId: string) => {
    const result = results.find(r => r.wellId === wellId)
    if (result && !result.isValid) return '#ef4444' // red for invalid
    if (selectedWells.has(wellId)) return '#2258cf' // accent for selected
    return '#6b7280' // gray for unselected
  }

  const handleWellClick = (wellId: string) => {
    const newSelected = new Set(selectedWells)
    if (newSelected.has(wellId)) {
      newSelected.delete(wellId)
    } else {
      newSelected.add(wellId)
    }
    setSelectedWells(newSelected)
  }

  // Check which rows and columns have data
  const hasDataInRow = (row: string) => {
    return cols.some(col => {
      const wellId = `${row}${col}`
      const data = getWellData(wellId)
      return data.length > 0
    })
  }

  const hasDataInCol = (col: number) => {
    return rows.some(row => {
      const wellId = `${row}${col}`
      const data = getWellData(wellId)
      return data.length > 0
    })
  }

  // Filter rows and columns that have data
  const rowsWithData = rows.filter(hasDataInRow)
  const colsWithData = cols.filter(hasDataInCol)

  // Add this calculation back to PlotArea.tsx
  const calculateGlobalYDomain = () => {
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
  }

  const globalYDomain = calculateGlobalYDomain()

  const cellWidth = compact ? 70 : 90
  const cellHeight = compact ? 50 : 75
  const totalHeight = compact ? 8 * cellHeight + 32 : 480

  return (
    <div className="bg-white rounded-lg shadow p-6" id="plot-area-export">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">Time Series Plots</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700 transition-transform duration-200"
            style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-gray-600">
          {selectedWells.size} wells selected
        </div>
      </div>

      {/* Scrollable container */}
      {!isCollapsed && (
        <div className="overflow-auto">
          <div 
            className="grid gap-0"
            style={{ 
              gridTemplateColumns: `60px repeat(${colsWithData.length}, ${cellWidth}px)`,
              minWidth: `${60 + (colsWithData.length * cellWidth)}px`,
              height: `${totalHeight}px`
            }}
          >
          {/* Column headers */}
          <div className="h-8 sticky top-0 bg-white z-10"></div>
          {colsWithData.map(col => (
            <div key={col} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 sticky top-0 bg-white z-10">
              {col}
            </div>
          ))}
          
          {/* Row headers and sparklines */}
          {rowsWithData.map(row => (
            <React.Fragment key={row}>
              <div className="flex items-center justify-center text-xs font-medium text-gray-500 sticky left-0 bg-white z-10" style={{ height: cellHeight, minHeight: cellHeight, maxHeight: cellHeight }}>
                {row}
              </div>
              {colsWithData.map(col => {
                const wellId = `${row}${col}`
                const data = getWellData(wellId)
                const color = getWellColor(wellId)
                const isSelected = selectedWells.has(wellId)
                
                if (data.length === 0) {
                  return (
                    <div key={wellId} className="flex items-center justify-center" style={{ 
                      width: cellWidth, 
                      minWidth: cellWidth, 
                      maxWidth: cellWidth, 
                      height: cellHeight, 
                      minHeight: cellHeight, 
                      maxHeight: cellHeight,
                      backgroundColor: '#f9fafb',
                      border: '1px dashed #d1d5db'
                    }}>
                      <span className="text-xs text-gray-400">-</span>
                    </div>
                  )
                }
                
                return (
                  <div key={wellId} className="flex items-center justify-center" style={{ width: cellWidth, minWidth: cellWidth, maxWidth: cellWidth, height: cellHeight, minHeight: cellHeight, maxHeight: cellHeight }}>
                    <ChartJsSparkline
                      data={data}
                      width={cellWidth}
                      height={cellHeight}
                      color={color}
                      isSelected={isSelected}
                      onClick={() => handleWellClick(wellId)}
                      xDomain={data.length > 0 ? data.length - 1 : 1}
                      yDomain={globalYDomain as [number, number]}
                    />
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      )}
    </div>
  )
} 