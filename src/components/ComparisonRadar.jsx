'use client'

import { useEffect, useRef, useState } from 'react'

export default function ComparisonRadar({ userScores, mode }) {
  const canvasRef = useRef(null)
  const [hoveredMetric, setHoveredMetric] = useState(null)

  // Ideal scores for each mode
  const idealScores = {
    pitch: { clarity: 90, confidence: 85, structure: 90, persuasion: 85, pace: 80 },
    interview: { clarity: 85, confidence: 90, relevance: 95, specificity: 85, pace: 80 },
    meeting: { clarity: 85, conciseness: 90, structure: 80, actionable: 85, pace: 80 },
    date: { authenticity: 85, engagement: 90, questions: 80, confidence: 75, pace: 70 },
    difficult: { empathy: 90, clarity: 85, assertiveness: 80, respect: 90, pace: 70 },
    speech: { clarity: 90, engagement: 90, structure: 85, presence: 85, pace: 75 },
    general: { clarity: 85, confidence: 80, structure: 80, engagement: 80, pace: 80 },
  }

  const ideal = idealScores[mode] || idealScores.general
  
  // Map user scores to ideal metrics (handle different key names)
  const normalizeScores = () => {
    const normalized = {}
    const idealKeys = Object.keys(ideal)
    
    idealKeys.forEach(key => {
      // Try to find matching score (case insensitive, partial match)
      const userKey = Object.keys(userScores).find(uk => 
        uk.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(uk.toLowerCase())
      )
      normalized[key] = userKey ? userScores[userKey] : 50
    })
    
    return normalized
  }

  const normalizedUserScores = normalizeScores()
  const metrics = Object.keys(ideal)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    
    // Set canvas size with device pixel ratio for sharpness
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) - 50

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw background circles with labels
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = 1; i <= 5; i++) {
      const r = (radius * i) / 5
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
      
      // Add percentage labels on the right
      if (i === 5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.font = '10px sans-serif'
        ctx.fillText('100', centerX + r + 10, centerY)
      }
    }

    // Draw axes and labels
    const angleStep = (2 * Math.PI) / metrics.length
    metrics.forEach((metric, i) => {
      const angle = i * angleStep - Math.PI / 2
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      // Draw axis line
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw label
      const labelRadius = radius + 30
      const labelX = centerX + labelRadius * Math.cos(angle)
      const labelY = centerY + labelRadius * Math.sin(angle)
      
      ctx.fillStyle = hoveredMetric === metric ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.7)'
      ctx.font = hoveredMetric === metric ? 'bold 12px sans-serif' : '11px sans-serif'
      ctx.fillText(
        metric.charAt(0).toUpperCase() + metric.slice(1), 
        labelX, 
        labelY
      )
    })

    // Draw ideal polygon (green area)
    ctx.beginPath()
    metrics.forEach((metric, i) => {
      const angle = i * angleStep - Math.PI / 2
      const value = ideal[metric] / 100
      const x = centerX + radius * value * Math.cos(angle)
      const y = centerY + radius * value * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.setLineDash([])

    // Draw user polygon (purple area)
    ctx.beginPath()
    metrics.forEach((metric, i) => {
      const angle = i * angleStep - Math.PI / 2
      const value = (normalizedUserScores[metric] || 50) / 100
      const x = centerX + radius * value * Math.cos(angle)
      const y = centerY + radius * value * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = 'rgba(129, 140, 248, 0.25)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(129, 140, 248, 1)'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Draw data points for user scores
    metrics.forEach((metric, i) => {
      const angle = i * angleStep - Math.PI / 2
      const value = (normalizedUserScores[metric] || 50) / 100
      const x = centerX + radius * value * Math.cos(angle)
      const y = centerY + radius * value * Math.sin(angle)

      // Outer glow
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(129, 140, 248, 0.3)'
      ctx.fill()

      // Inner point
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(129, 140, 248, 1)'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })

  }, [userScores, mode, ideal, metrics, normalizedUserScores, hoveredMetric])

  // Calculate how user compares to ideal
  const calculateGap = () => {
    let totalGap = 0
    let metricsAbove = 0
    
    metrics.forEach(metric => {
      const userScore = normalizedUserScores[metric] || 50
      const idealScore = ideal[metric]
      totalGap += idealScore - userScore
      if (userScore >= idealScore) metricsAbove++
    })
    
    const avgGap = totalGap / metrics.length
    return { avgGap: Math.round(avgGap), metricsAbove }
  }

  const { avgGap, metricsAbove } = calculateGap()

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            📊 Performance vs Ideal
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Compare your results to top performers in {modeNames[mode] || 'General'} mode
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-indigo-500" />
            <span className="text-gray-400">You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500 rounded" style={{ borderStyle: 'dashed' }} />
            <span className="text-gray-400">Ideal</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex justify-center">
        <canvas 
          ref={canvasRef} 
          style={{ width: '320px', height: '320px' }}
          className="max-w-full"
        />
      </div>

      {/* Summary */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        {metricsAbove === metrics.length ? (
          <div className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
            🎉 You're performing at or above ideal in all areas!
          </div>
        ) : metricsAbove > metrics.length / 2 ? (
          <div className="px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium">
            ⭐ Great job! You're above ideal in {metricsAbove}/{metrics.length} areas
          </div>
        ) : (
          <div className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
            📈 On average, you're {avgGap} points below the ideal - keep practicing!
          </div>
        )}
      </div>

      {/* Metric Details */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map(metric => {
          const userScore = normalizedUserScores[metric] || 50
          const idealScore = ideal[metric]
          const diff = userScore - idealScore
          
          return (
            <div 
              key={metric}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-default"
              onMouseEnter={() => setHoveredMetric(metric)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <div className="text-xs text-gray-400 capitalize mb-1">{metric}</div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">{userScore}</span>
                <span className={`text-sm font-medium ${
                  diff >= 0 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {diff >= 0 ? '+' : ''}{diff}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const modeNames = {
  pitch: 'Pitch',
  interview: 'Interview',
  meeting: 'Meeting',
  date: 'Date',
  difficult: 'Difficult Talk',
  speech: 'Speech',
  general: 'General',
}