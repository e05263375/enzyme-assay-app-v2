import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ChartJsSparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  onClick?: () => void
  isSelected?: boolean
  yDomain?: [number, number]
  xDomain?: number
  /** When true, no tooltip/hover; use for static control-well grid */
  static?: boolean
  /** When isSelected and set, use as background (pastel) and line color red */
  selectionPastelColor?: string
}

export const ChartJsSparkline: React.FC<ChartJsSparklineProps> = ({
  data,
  width = 80,
  height = 40,
  color = '#2258cf',
  onClick,
  isSelected = false,
  yDomain = [0, 1],
  xDomain = 10,
  static: staticMode = false,
  selectionPastelColor
}) => {

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-gray-400 border rounded ${
          isSelected ? 'border-accent bg-accent/5' : 'border-gray-200'
        }`}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          minWidth: `${width}px`,
          maxWidth: `${width}px`,
          minHeight: `${height}px`,
          maxHeight: `${height}px`
        }}
        onClick={onClick}
      >
        No data
      </div>
    )
  }

  const chartYDomain = yDomain
  const lineColor = staticMode && isSelected && selectionPastelColor ? '#ef4444' : color
  const bgStyle = staticMode && isSelected && selectionPastelColor ? { backgroundColor: selectionPastelColor } : undefined

  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data: data,
        borderColor: lineColor,
        backgroundColor: lineColor,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: staticMode ? 0 : 2,
        tension: 0.1,
        fill: false
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: !staticMode,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#d1d5db',
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          title: (context: any) => `Time: ${context[0].dataIndex}`,
          label: (context: any) => `Value: ${context.parsed.y.toFixed(3)}`
        }
      }
    },
    scales: {
      x: {
        display: false,
        min: 0,
        max: xDomain, // Use xDomain instead of data.length - 1
        grid: {
          display: false
        }
      },
      y: {
        display: false,
        min: chartYDomain[0],
        max: chartYDomain[1],
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    elements: {
      point: {
        hoverRadius: staticMode ? 0 : 2
      }
    }
  }

  return (
    <div
      className={`cursor-pointer border rounded flex-shrink-0 ${
        !staticMode && isSelected ? 'border-accent bg-accent/5' : staticMode && isSelected && selectionPastelColor ? 'border-gray-300' : 'bg-white border-gray-200'
      }`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        minHeight: `${height}px`,
        maxHeight: `${height}px`,
        ...bgStyle
      }}
      onClick={onClick}
    >
      <Line data={chartData} options={options} />
    </div>
  )
} 