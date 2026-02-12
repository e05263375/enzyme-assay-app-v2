import React, { useRef } from 'react'
import { AppHeader } from '../components/AppHeader'
import { DataInputPanel } from '../components/DataInputPanel'
import { ParametersPanel } from '../components/ParametersPanel'
import { PlotArea } from '../components/PlotArea'
import PlateResultsGrid from '../components/PlateResultsGrid'
import { ExportActions } from '../components/ExportActions'
import { TabbedInterface, TabbedInterfaceRef } from '../components/TabbedInterface'

import { useAssayStore } from '../features/hooks'

export const HomePage: React.FC = () => {
  const { isLoading } = useAssayStore()
  const tabbedInterfaceRef = useRef<TabbedInterfaceRef>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <TabbedInterface
          ref={tabbedInterfaceRef}
          tabs={[
            {
              id: 'data',
              label: 'Data Loading',
              content: <DataInputPanel onNext={() => tabbedInterfaceRef.current?.setActiveTab('params')} />
            },
            {
              id: 'params',
              label: 'Parameters',
              content: <ParametersPanel onCalculate={() => tabbedInterfaceRef.current?.setActiveTab('results')} />
            },
            {
              id: 'results',
              label: 'Results',
              content: (
        <div className="flex flex-col gap-8">
          <PlotArea />
          <PlateResultsGrid />
          <ExportActions />
        </div>
              )
            }
          ]}
        />
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              <p className="text-gray-600 mt-2">Calculating results...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 