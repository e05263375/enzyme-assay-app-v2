import { create } from 'zustand'
import { z } from 'zod'
import { calcT2943, calcHoFF, validateWellData } from '../utils/metrics'

// Types
export type AssayType = 'HoFF' | 'T2943'
export type HoFFMetric = 'HLT' | 'MLR' | 'TMLR' | 'FI' | 'PL'

export interface WellData {
  wellId: string
  timePoints: number[]
}

export interface AssayResult {
  wellId: string
  value: number
  isValid: boolean
}

export interface AppState {
  // Assay configuration
  assayType: AssayType
  timeRange: [number, number]
  smoothingWindow: number
  hoffMetric: HoFFMetric
  hltPercentage: number // Percentage threshold for Half Lysis Time (10-100%)
  
  // Control value options
  useActual0Control: boolean // If true, use actual 0% control well values; if false, use 0
  custom100ControlValue: number | null // If null, use average of selected 100% wells; otherwise use this value
  
  // Data
  rawData: WellData[]
  selectedWells: Set<string>
  control0Wells: Set<string>
  control100Wells: Set<string>
  /** Wells selected for Lysis % (must be sample wells); optional */
  lysisPercentWells: Set<string>
  /** Time t in minutes for Percentage Lysis output */
  lysisPercentTimeT: number
  
  // Results
  results: AssayResult[]
  isLoading: boolean
  errors: string[]
  
  // UI state
  showWellSelector: boolean
  // Precision control
  sigDigits: number
}

export interface AppActions {
  // Assay configuration
  setAssayType: (type: AssayType) => void
  setTimeRange: (range: [number, number]) => void
  setSmoothingWindow: (window: number) => void
  setHoffMetric: (metric: HoFFMetric) => void
  setHltPercentage: (percentage: number) => void
  setUseActual0Control: (use: boolean) => void
  setCustom100ControlValue: (value: number | null) => void
  
  // Data management
  setRawData: (data: WellData[]) => void
  setSelectedWells: (wells: Set<string>) => void
  setControl0Wells: (wells: Set<string>) => void
  setControl100Wells: (wells: Set<string>) => void
  setLysisPercentWells: (wells: Set<string>) => void
  setLysisPercentTimeT: (t: number) => void
  
  // Results
  setResults: (results: AssayResult[]) => void
  setLoading: (loading: boolean) => void
  setErrors: (errors: string[]) => void
  
  // UI state
  setShowWellSelector: (show: boolean) => void
  
  // Actions
  calculate: () => void
  reset: () => void
  // Precision control
  incDigits: () => void
  decDigits: () => void
}

export type AppStore = AppState & AppActions

// Validation schemas
export const wellDataSchema = z.object({
  wellId: z.string().regex(/^[A-H](?:[1-9]|1[0-2])$/),
  timePoints: z.array(z.number().finite()).min(1)
})

export const plateDataSchema = z.array(wellDataSchema).length(96)

// Store
export const useAssayStore = create<AppStore>((set, get) => ({
  // Initial state
  assayType: 'HoFF',
  timeRange: [0, 60],
  smoothingWindow: 10,
  hoffMetric: 'FI',
  hltPercentage: 50,
  useActual0Control: false, // Default: use 0 for 0% control
  custom100ControlValue: null, // Default: use average of selected 100% wells
  
  rawData: [],
  selectedWells: new Set(),
  control0Wells: new Set(),
  control100Wells: new Set(),
  lysisPercentWells: new Set(),
  lysisPercentTimeT: 1,
  
  results: [],
  isLoading: false,
  errors: [],
  
  showWellSelector: false,
  
  // Precision control
      sigDigits: 5,
    incDigits: () => set(s => ({ sigDigits: Math.min(6, s.sigDigits + 1) })),
    decDigits: () => set(s => ({ sigDigits: Math.max(1, s.sigDigits - 1) })),
  
  // Actions
  setAssayType: (type) => set({ assayType: type }),
  setTimeRange: (range) => set({ timeRange: range }),
  setSmoothingWindow: (window) => set({ smoothingWindow: window }),
  setHoffMetric: (metric) => set({ hoffMetric: metric }),
  setHltPercentage: (percentage) => set({ hltPercentage: percentage }),
  setUseActual0Control: (use) => set({ useActual0Control: use }),
  setCustom100ControlValue: (value) => set({ custom100ControlValue: value }),
  
  setRawData: (data) => set({ rawData: data }),
  setSelectedWells: (wells) => set({ selectedWells: wells }),
  setControl0Wells: (wells) => set({ control0Wells: wells }),
  setControl100Wells: (wells) => set({ control100Wells: wells }),
  setLysisPercentWells: (wells) => set({ lysisPercentWells: wells }),
  setLysisPercentTimeT: (t) => set({ lysisPercentTimeT: t }),
  
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ isLoading: loading }),
  setErrors: (errors) => set({ errors }),
  
  setShowWellSelector: (show) => set({ showWellSelector: show }),
  
  calculate: () => {
    const state = get()
    set({ isLoading: true, errors: [] })
    
    try {
      // Validate data
      const validationErrors = validateWellData(state.rawData)
      if (validationErrors.length > 0) {
        set({ errors: validationErrors, isLoading: false })
        return
      }
      
      // Check if we have selected wells
      if (state.selectedWells.size === 0) {
        set({ errors: ['No wells selected for analysis'], isLoading: false })
        return
      }

      // Percentage Lysis output is shown in Parameters panel; no results table update
      if (state.assayType === 'HoFF' && state.hoffMetric === 'PL') {
        set({ results: [], isLoading: false })
        return
      }
      
      const results: AssayResult[] = []
      
      // Process each selected well
      for (const wellId of state.selectedWells) {
        const wellData = state.rawData.find(well => well.wellId === wellId)
        if (!wellData) continue
        
        try {
          let value = 0
          
          switch (state.assayType) {
            case 'T2943': {
              // For T2943, use single well data (no duplicate averaging)
              const t2943Data = [wellData.timePoints, wellData.timePoints]
              const calcResult = calcT2943(t2943Data, state.smoothingWindow)
              value = calcResult.result
              break
            }
            case 'HoFF': {
              if (state.control0Wells.size === 0 || state.control100Wells.size === 0) {
                throw new Error('Both 0% and 100% control wells required for HoFF')
              }
              
              // Calculate 0% control value
              let alexa0 = 0
              let bgCtrlHoFF: number[] = []
              
              if (state.useActual0Control && state.control0Wells.size >= 2) {
                // Use average of all selected 0% control wells
                const control0Data: number[][] = []
                for (const ctrlWellId of state.control0Wells) {
                  const ctrlWell = state.rawData.find(w => w.wellId === ctrlWellId)
                  if (ctrlWell) {
                    control0Data.push(ctrlWell.timePoints)
                  }
                }
                
                if (control0Data.length > 0) {
                  // Average across all 0% control wells for each time point
                  const numTimePoints = control0Data[0].length
                  bgCtrlHoFF = Array.from({ length: numTimePoints }, (_, i) => {
                    const sum = control0Data.reduce((acc, well) => acc + (well[i] || 0), 0)
                    return parseFloat((sum / control0Data.length).toFixed(15))
                  })
                  
                  // alexa0 is the minimum value from averaged 0% control
                  const minVal = Math.min(...bgCtrlHoFF.filter(isFinite))
                  alexa0 = parseFloat(minVal.toFixed(15))
                } else {
                  bgCtrlHoFF = Array(wellData.timePoints.length).fill(0)
                }
              } else {
                // Default: use 0 for 0% control
                bgCtrlHoFF = Array(wellData.timePoints.length).fill(0)
                alexa0 = 0
              }
              
              // Calculate 100% control value
              let alexa100 = 100
              
              if (state.custom100ControlValue !== null) {
                // Use custom value
                alexa100 = parseFloat(state.custom100ControlValue.toFixed(15))
              } else {
                // Use average of all selected 100% control wells
                // First: get average of last 10 values for each individual well
                // Then: average across all selected wells
                const wellAverages: number[] = []
                
                for (const ctrlWellId of state.control100Wells) {
                  const ctrlWell = state.rawData.find(w => w.wellId === ctrlWellId)
                  if (ctrlWell && ctrlWell.timePoints.length > 0) {
                    // Get last 10 values (or all if fewer than 10)
                    const last10 = ctrlWell.timePoints.slice(-10).filter(isFinite)
                    if (last10.length > 0) {
                      const sum = last10.reduce((acc, v) => acc + v, 0)
                      const avg = sum / last10.length
                      wellAverages.push(parseFloat(avg.toFixed(15)))
                    }
                  }
                }
                
                if (wellAverages.length > 0) {
                  // Average across all well averages
                  const sum = wellAverages.reduce((acc, v) => acc + v, 0)
                  alexa100 = parseFloat((sum / wellAverages.length).toFixed(15))
                }
              }
              
              // Use single well data (no duplicate averaging)
              const processedData = [wellData.timePoints]
              
              console.log(`HoFF calculation for well ${wellId}:`)
              console.log('  - timeRange:', state.timeRange)
              console.log('  - totalDuration:', state.timeRange[1])
              console.log('  - wellData.timePoints.length:', wellData.timePoints.length)
              console.log('  - useActual0Control:', state.useActual0Control)
              console.log('  - alexa0:', alexa0)
              console.log('  - alexa100:', alexa100)
              
              value = calcHoFF({
                duplicate: processedData,
                bgCtrl: bgCtrlHoFF,
                metric: state.hoffMetric,
                window: state.smoothingWindow,
                alexa0,
                alexa100,
                totalDuration: state.timeRange[1],
                hltPercentage: state.hltPercentage
              })
              break
            }
          }
          
          results.push({
            wellId,
            value,
            isValid: isFinite(value)
          })
          
        } catch (error) {
          results.push({
            wellId,
            value: 0,
            isValid: false
          })
        }
      }
      
      set({ results, isLoading: false })
      
    } catch (error) {
      set({ 
        errors: [error instanceof Error ? error.message : 'Unknown error'], 
        isLoading: false 
      })
    }
  },
  
  reset: () => set({
    rawData: [],
    selectedWells: new Set(),
    results: [],
    errors: [],
    isLoading: false
  })
})) 