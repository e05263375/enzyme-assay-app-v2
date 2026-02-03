import React from 'react'
import { useAssayStore, AssayType } from '../features/hooks'
import { PasteTable } from './PasteTable'

interface DataInputPanelProps {
  onNext?: () => void
}

export const DataInputPanel: React.FC<DataInputPanelProps> = ({ onNext }) => {
  const { assayType, setAssayType, rawData } = useAssayStore()

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Assay
        </label>
        <select
          value={assayType}
          onChange={(e) => setAssayType(e.target.value as AssayType)}
          className="input-field"
        >
          <option value="HoFF">Fibrinolysis: HoFF test</option>
          <option value="T2943">tPA activity assay</option>
        </select>
      </div>

      <div>
        <PasteTable />
      </div>

      {rawData.length > 0 && onNext && (
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onNext}
            className="btn-primary"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}


