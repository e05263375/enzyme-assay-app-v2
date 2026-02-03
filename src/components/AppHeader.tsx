import React, { useState } from 'react'
import { useAssayStore, AssayType } from '../features/hooks'

export const AppHeader: React.FC = () => {
  const { assayType } = useAssayStore()
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const getAssayDescription = (type: AssayType) => {
    switch (type) {
      case 'T2943':
        return 'tPA Activity Assay'
      case 'HoFF':
        return 'Fibrinolysis: HoFF Test'
      default:
        return 'Enzyme Assay Analysis'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900"> 
              Enzyme Assay Analyzer   
            </h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <p className="text-lg font-medium text-accent">
                {getAssayDescription(assayType)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="btn-secondary"
              type="button"
            >
              Info
            </button>
            <div className="text-sm text-gray-500">
              Version 2.0
            </div>
          </div>
        </div>
      </div>

      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsHelpOpen(false)}
          />
          <div className="relative bg-white w-full max-w-2xl mx-4 rounded-lg shadow-xl border">
            <div className="flex items-start justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Information</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Input/output values and parameter functions
                </p>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-gray-500 hover:text-gray-800 px-2 py-1"
                aria-label="Close help"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-sm text-gray-800">
              <div>
                <h3 className="font-semibold text-gray-900">Data Input:</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Load your data either by copying and pasting from the excel sheet or uploading the excel file obtained from the plate reader</li>
                  <li>Data files should not contain any gaps or spaces between characters and avoid unusual characters</li>
                  <li>Default setting for half lysis time is 50% but can be adjusted</li>
                  <li>Max lysis rate uses the average of the last 10 values along the equilibrium</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Smoothing Window</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Default of smoothing window is set to 10 but can be adjusted</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Select Control Wells:</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Select 0% control wells (blue) and 100% control wells (green) used in the experiment which will be used in subsequent calculations. unselected wells will be assumed to be sample wells.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Control Value Option:</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>0% Control Value provides backgrounf fluorescence. The default calculation would treat the background noise as 0, but can be adjusted.</li>
                  <li>100% Control Value is the fully fibrinolytic sample. The default calculation would be the average of the last 10 values of the selected 100% Control Wells. A custom valye can also be used.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Calculation Option:</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Select the desired calculation output option</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="btn-primary"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
} 