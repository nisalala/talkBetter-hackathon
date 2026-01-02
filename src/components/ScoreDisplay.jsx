'use client'

export default function ScoreDisplay({ score, label, size = 'normal' }) {
  const getScoreColor = (score) => {
    if (score >= 80) return { ring: 'text-green-500', text: 'text-green-400', bg: 'bg-green-500/10' }
    if (score >= 60) return { ring: 'text-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' }
    return { ring: 'text-red-500', text: 'text-red-400', bg: 'bg-red-500/10' }
  }

  const colors = getScoreColor(score)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference
  
  const sizeClasses = size === 'large' 
    ? 'w-40 h-40' 
    : 'w-24 h-24'
  
  const fontSize = size === 'large' 
    ? 'text-4xl' 
    : 'text-xl'

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={colors.ring}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-out',
            }}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${fontSize} ${colors.text}`}>
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-2 text-sm text-gray-400 text-center">{label}</span>
      )}
    </div>
  )
}