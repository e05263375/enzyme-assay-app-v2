import React from 'react'
import { useAssayStore } from '../features/hooks'
import { PasteTable } from './PasteTable'
import { PlotArea } from './PlotArea'

interface DataInputPanelProps {
  onNext?: () => void
}

export const DataInputPanel: React.FC<DataInputPanelProps> = ({ onNext }) => {
  const {
    assayType,
    setAssayType,
    rawData,
    setSelectedWells,
    setControl0Wells,
    setControl100Wells
  } = useAssayStore()

  const handleNext = () => {
    if (rawData.length > 0) {
      setSelectedWells(new Set(rawData.map(w => w.wellId)))
      setControl0Wells(new Set())
      setControl100Wells(new Set())
    }
    onNext?.()
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Assay
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setAssayType('HoFF')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              assayType === 'HoFF'
                ? 'bg-accent text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Fibrinolysis: HoFF test
          </button>
          <button
            onClick={() => setAssayType('T2943')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              assayType === 'T2943'
                ? 'bg-accent text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            tPA activity assay
          </button>
        </div>
      </div>

      <div>
        <PasteTable />
      </div>

      {rawData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Time Series Plot (for validation)</h3>
          <PlotArea compact />
        </div>
      )}

      {rawData.length > 0 && onNext && (
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleNext}
            className="btn-primary"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}


