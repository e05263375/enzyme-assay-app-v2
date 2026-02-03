import React, { useMemo, useState } from 'react'
import { useAssayStore, HoFFMetric } from '../features/hooks'
import { WellGrid } from './WellGrid'

interface ParametersPanelProps {
  onCalculate?: () => void
}

const MIN_TOTAL_MINUTES = 15
const MINUTE_OPTIONS = [0, 15, 30, 45]
const MAX_HOURS = 12

function clampTotalMinutes(total: number) {
  if (!Number.isFinite(total)) return 60
  return Math.max(MIN_TOTAL_MINUTES, Math.round(total / 15) * 15)
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({ onCalculate }) => {
  const {
    assayType,
    timeRange,
    smoothingWindow,
    hoffMetric,
    hltPercentage,
    useActual0Control,
    custom100ControlValue,
    selectedWells,
    control0Wells,
    control100Wells,
    setTimeRange,
    setSmoothingWindow,
    setHoffMetric,
    setHltPercentage,
    setUseActual0Control,
    setCustom100ControlValue,
    setSelectedWells,
    setControl0Wells,
    setControl100Wells,
    calculate,
    isLoading,
    rawData
  } = useAssayStore()

  const totalMinutes = clampTotalMinutes(timeRange[1])

  const { hoursValue, minutesValue } = useMemo(() => {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    // normalize minutes to our option list
    const nearest = MINUTE_OPTIONS.reduce((best, cur) =>
      Math.abs(cur - m) < Math.abs(best - m) ? cur : best
    , MINUTE_OPTIONS[0])
    return { hoursValue: Math.min(MAX_HOURS, h), minutesValue: nearest }
  }, [totalMinutes])

  const [isWellSelectorCollapsed, setIsWellSelectorCollapsed] = useState(false)
  const [wellSelectionMode, setWellSelectionMode] = useState<'sample' | 'control0' | 'control100'>('sample')

  const setDurationFromHM = (h: number, m: number) => {
    const next = clampTotalMinutes(h * 60 + m)
    setTimeRange([0, next])
  }

  // Traditional well toggle for T2943 (simple selection without control logic)
  const handleSimpleWellToggle = (wellId: string) => {
    const newSelected = new Set(selectedWells)
    if (newSelected.has(wellId)) {
      newSelected.delete(wellId)
    } else {
      newSelected.add(wellId)
    }
    setSelectedWells(newSelected)
  }

  const handleCombinedWellToggle = (wellId: string) => {
    // Handle well selection based on current mode
    if (wellSelectionMode === 'sample') {
      // For HoFF assay, remove from control wells if present
      if (assayType === 'HoFF') {
        if (control0Wells.has(wellId)) {
          const newControl0 = new Set(control0Wells)
          newControl0.delete(wellId)
          setControl0Wells(newControl0)
        }
        if (control100Wells.has(wellId)) {
          const newControl100 = new Set(control100Wells)
          newControl100.delete(wellId)
          setControl100Wells(newControl100)
        }
      }
      // Toggle sample wells
      const newSelected = new Set(selectedWells)
      if (newSelected.has(wellId)) {
        newSelected.delete(wellId)
      } else {
        newSelected.add(wellId)
      }
      setSelectedWells(newSelected)
    } else if (wellSelectionMode === 'control0' && assayType === 'HoFF') {
      // Remove from control100 if present
      if (control100Wells.has(wellId)) {
        const newControl100 = new Set(control100Wells)
        newControl100.delete(wellId)
        setControl100Wells(newControl100)
      }
      // Toggle control0 wells
      const newControl0 = new Set(control0Wells)
      const newSelected = new Set(selectedWells)
      if (newControl0.has(wellId)) {
        newControl0.delete(wellId)
        newSelected.delete(wellId) // Also remove from selectedWells
      } else {
        newControl0.add(wellId)
        newSelected.add(wellId) // Also add to selectedWells for calculation
      }
      setControl0Wells(newControl0)
      setSelectedWells(newSelected)
    } else if (wellSelectionMode === 'control100' && assayType === 'HoFF') {
      // Remove from control0 if present
      if (control0Wells.has(wellId)) {
        const newControl0 = new Set(control0Wells)
        newControl0.delete(wellId)
        setControl0Wells(newControl0)
      }
      // Toggle control100 wells
      const newControl100 = new Set(control100Wells)
      const newSelected = new Set(selectedWells)
      if (newControl100.has(wellId)) {
        newControl100.delete(wellId)
        newSelected.delete(wellId) // Also remove from selectedWells
      } else {
        newControl100.add(wellId)
        newSelected.add(wellId) // Also add to selectedWells for calculation
      }
      setControl100Wells(newControl100)
      setSelectedWells(newSelected)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
              <select
                value={hoursValue}
                onChange={(e) => setDurationFromHM(parseInt(e.target.value, 10), minutesValue)}
                className="input-field"
              >
                {Array.from({ length: MAX_HOURS + 1 }, (_, h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Minutes</label>
              <select
                value={minutesValue}
                onChange={(e) => setDurationFromHM(hoursValue, parseInt(e.target.value, 10))}
                className="input-field"
              >
                {MINUTE_OPTIONS.map(m => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Minimum duration is {MIN_TOTAL_MINUTES} minutes.
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Smoothing Window
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min={1}
              max={50}
              value={smoothingWindow}
              onChange={(e) => setSmoothingWindow(parseInt(e.target.value) || 10)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span className="font-medium text-gray-700">{smoothingWindow}</span>
              <span>50</span>
            </div>
          </div>
        </div>
      </div>

      {/* Well Selection - Combined with Control Wells */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Wells
          </label>
          <button
            onClick={() => setIsWellSelectorCollapsed(!isWellSelectorCollapsed)}
            className="text-gray-500 hover:text-gray-700 transition-transform duration-200"
            style={{ transform: isWellSelectorCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {!isWellSelectorCollapsed && (
          <div className="space-y-4">
            {/* For T2943: Simple well selection */}
            {assayType === 'T2943' && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <WellGrid
                  selected={selectedWells}
                  onChange={handleSimpleWellToggle}
                  mode="wells"
                />
              </div>
            )}

            {/* For HoFF: Combined selection with control wells */}
            {assayType === 'HoFF' && (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setWellSelectionMode('sample')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      wellSelectionMode === 'sample'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Sample Wells
                  </button>
                  <button
                    onClick={() => setWellSelectionMode('control0')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      wellSelectionMode === 'control0'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    0% Control
                  </button>
                  <button
                    onClick={() => setWellSelectionMode('control100')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      wellSelectionMode === 'control100'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    100% Control
                  </button>
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <WellGrid
                    selected={selectedWells}
                    onChange={handleCombinedWellToggle}
                    control0Wells={control0Wells}
                    control100Wells={control100Wells}
                    mode="combined"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Control Value Options */}
      {assayType === 'HoFF' && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-900">Control Value Options</h3>
          
          {/* 0% Control Option */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useActual0Control}
                onChange={(e) => setUseActual0Control(e.target.checked)}
                className="w-4 h-4 text-accent focus:ring-accent"
                disabled={control0Wells.size < 2}
              />
              <span className="text-sm text-gray-700">
                Use actual 0% control well values
                {control0Wells.size < 2 && (
                  <span className="text-xs text-gray-500 ml-1">(requires 2+ wells selected)</span>
                )}
              </span>
            </label>
            {!useActual0Control && (
              <p className="text-xs text-gray-500 ml-6">Default: Using 0 for 0% control</p>
            )}
            {useActual0Control && control0Wells.size >= 2 && (
              <p className="text-xs text-gray-500 ml-6">Using average of {control0Wells.size} selected 0% control wells</p>
            )}
          </div>
          
          {/* 100% Control Option */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              100% Control Value
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="control100Mode"
                  checked={custom100ControlValue === null}
                  onChange={() => setCustom100ControlValue(null)}
                  className="w-4 h-4 text-accent focus:ring-accent"
                />
                <span className="text-sm text-gray-700">
                  Use average of selected 100% control wells ({control100Wells.size} wells)
                </span>
              </label>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="control100Mode"
                    checked={custom100ControlValue !== null}
                    onChange={() => {
                      if (custom100ControlValue === null) {
                        setCustom100ControlValue(100)
                      }
                    }}
                    className="w-4 h-4 text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-gray-700">Use custom value:</span>
                </label>
                <input
                  type="number"
                  value={custom100ControlValue !== null ? custom100ControlValue : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setCustom100ControlValue(isNaN(val) ? null : val)
                  }}
                  onFocus={() => {
                    if (custom100ControlValue === null) {
                      setCustom100ControlValue(100)
                    }
                  }}
                  className="input-field w-24"
                  step="0.1"
                  disabled={custom100ControlValue === null}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Options */}
      {assayType === 'HoFF' && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-900">Calculation Option</h3>
          <div className="space-y-2">
            {(['FI', 'HLT', 'MLR', 'TMLR'] as HoFFMetric[]).map((metric) => (
              <label key={metric} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="hoffMetric"
                  value={metric}
                  checked={hoffMetric === metric}
                  onChange={(e) => setHoffMetric(e.target.value as HoFFMetric)}
                  className="w-4 h-4 text-accent focus:ring-accent"
                />
                <span className="text-sm text-gray-700">
                  {metric === 'HLT' && 'Half Lysis Time (HLT)'}
                  {metric === 'MLR' && 'Max Lysis Rate (MLR)'}
                  {metric === 'TMLR' && 'Time of Max Lysis Rate (TMLR)'}
                  {metric === 'FI' && 'Fibrinolysis Index (FI)'}
                </span>
              </label>
            ))}
          </div>
          
          {/* HLT Percentage Dropdown - only show when HLT is selected */}
          {hoffMetric === 'HLT' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Half Lysis Time Percentage
              </label>
              <select
                value={hltPercentage}
                onChange={(e) => setHltPercentage(parseInt(e.target.value, 10))}
                className="input-field"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const percentage = (i + 1) * 10
                  return (
                    <option key={percentage} value={percentage}>
                      {percentage}%
                    </option>
                  )
                })}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end pt-4 border-t">
        <button
          onClick={() => {
            calculate()
            if (onCalculate) {
              // Wait a bit for calculation to start, then navigate
              setTimeout(() => {
                onCalculate()
              }, 100)
            }
          }}
          disabled={isLoading || selectedWells.size === 0 || rawData.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>
    </div>
  )
}


