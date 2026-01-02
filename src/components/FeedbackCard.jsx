'use client'

export default function FeedbackCard({ title, items, type }) {
  const config = {
    strengths: {
      icon: '💪',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      textColor: 'text-green-400',
      iconBg: 'bg-green-500/20',
    },
    improvements: {
      icon: '🎯',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      textColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
    },
  }

  const style = config[type] || config.strengths

  return (
    <div className={`rounded-2xl ${style.bgColor} border ${style.borderColor} p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center text-xl`}>
          {style.icon}
        </div>
        <h3 className={`text-lg font-semibold ${style.textColor}`}>{title}</h3>
      </div>
      <ul className="space-y-3">
        {items && items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className={`mt-1.5 w-2 h-2 rounded-full ${style.textColor} bg-current flex-shrink-0`} />
            <span className="text-gray-300">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}