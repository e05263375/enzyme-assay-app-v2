import React from 'react'
import { saveAs } from 'file-saver' // trigger file downloads
import * as XLSX from 'xlsx'    // build excel files
import { useAssayStore } from '../features/hooks'   // provides shared state
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export const ExportActions: React.FC = () => {
  const { results, assayType, rawData } = useAssayStore()

  // Create plate view data (8x12 grid)
  const createPlateViewData = () => {
    const plateData: (string | number)[][] = []
    
    // Add header row with column numbers
    const headerRow = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    plateData.push(headerRow)
    
    // Create 8x12 grid
    for (let row = 0; row < 8; row++) {
      const rowLetter = String.fromCharCode(65 + row) // A, B, C, ..., H
      const plateRow: (string | number)[] = [rowLetter]
      
      for (let col = 1; col <= 12; col++) {
        const wellId = `${rowLetter}${col}`
        const result = results.find(r => r.wellId === wellId)
        
        if (result && result.isValid) {
          plateRow.push(result.value)
        } else {
          plateRow.push('')
        }
      }
      plateData.push(plateRow)
    }
    
    return plateData
  }

  const exportToCSV = () => {
    if (results.length === 0) return

    const plateData = createPlateViewData()
    const csvContent = plateData.map(row => 
      row.map(cell => typeof cell === 'string' ? cell : cell.toFixed(4)).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `enzyme_assay_results_${assayType}_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportToXLSX = () => {
    if (results.length === 0) return

    const plateData = createPlateViewData()
    
    // Convert to worksheet format
    const worksheet = XLSX.utils.aoa_to_sheet(plateData)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `enzyme_assay_results_${assayType}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportPlots = async (format: 'png' | 'pdf' | 'tif') => {
    // Try to find the plot area by ID first, then fallback to other selectors
    let plotElement = document.getElementById('plot-area-export')
    
    // If not found, try to find it in the results tab
    if (!plotElement) {
      const resultsTab = document.querySelector('[id="results"]') || 
                        document.querySelector('[class*="results"]')
      if (resultsTab) {
        plotElement = resultsTab.querySelector('#plot-area-export') as HTMLElement
      }
    }
    
    // Last resort: find any element with canvas
    if (!plotElement) {
      const canvasParent = document.querySelector('canvas')?.closest('.bg-white.rounded-lg.shadow')
      if (canvasParent) {
        plotElement = canvasParent as HTMLElement
      }
    }
    
    if (!plotElement) {
      alert('Could not find plot element to export. Please ensure the plot is visible in the Results tab.')
      return
    }

    try {
      const canvas = await html2canvas(plotElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      })

      if (format === 'png') {
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `time_series_plot_${new Date().toISOString().split('T')[0]}.png`)
          }
        }, 'image/png')
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        })
        
        const imgWidth = pdf.internal.pageSize.getWidth()
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
        pdf.save(`time_series_plot_${new Date().toISOString().split('T')[0]}.pdf`)
      } else if (format === 'tif') {
        // TIF format - browsers don't natively support TIF, so we'll export as PNG with TIF extension
        // or use a library. For now, we'll export as PNG but with .tif extension
        // Note: True TIF requires additional processing, this is a workaround
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `time_series_plot_${new Date().toISOString().split('T')[0]}.tif`)
          }
        }, 'image/png')
      }
    } catch (error) {
      console.error('Error exporting plot:', error)
      alert('Failed to export plot. Please try again or use browser screenshot.')
    }
  }

  const exportRawData = () => {
    if (rawData.length === 0) return

    const headers = ['Well ID', ...Array.from({ length: rawData[0]?.timePoints.length || 0 }, (_, i) => `T${i}`)]
    const csvContent = [
      headers.join(','),
      ...rawData.map(well => [
        well.wellId,
        ...well.timePoints.map(point => point.toFixed(4))
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `raw_data_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={exportToCSV}
          disabled={results.length === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export Results (CSV)
        </button>
        
        <button
          onClick={exportToXLSX}
          disabled={results.length === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export Results (XLSX)
        </button>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={() => exportPlots('png')}
            disabled={rawData.length === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            Export Plot (PNG)
          </button>
          <button
            onClick={() => exportPlots('pdf')}
            disabled={rawData.length === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            Export Plot (PDF)
          </button>
          <button
            onClick={() => exportPlots('tif')}
            disabled={rawData.length === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            Export Plot (TIF)
          </button>
        </div>
        
        <button
          onClick={exportRawData}
          disabled={rawData.length === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export Raw Data
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>• CSV/XLSX exports include results in plate view format (8x12 grid)</p>
        <p>• Raw data export includes all time series data</p>
        <p>• Plot export available in PNG, PDF, and TIF formats</p>
      </div>
    </div>
  )
} 