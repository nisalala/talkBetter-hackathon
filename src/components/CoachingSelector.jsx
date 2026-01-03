// // src/components/CoachingSelector.jsx
// 'use client'
// import { useState } from 'react'
// import PricingModal from './PricingModal'

// export default function CoachingSelector({ selectedStyle, onSelectStyle }) {
//   const [modalTier, setModalTier] = useState(null)

//   const handleStyleClick = (style) => {
//     // If Gentle, select immediately (Free)
//     if (style === 'gentle') {
//       onSelectStyle('gentle')
//     } else {
//       // If Paid, show modal (unless already selected)
//       if (selectedStyle !== style) {
//         setModalTier(style)
//       }
//     }
//   }

//   const handlePaymentSuccess = (tier) => {
//     onSelectStyle(tier)
//     setModalTier(null)
//   }

//   // Helper for styling cards
//   const getCardStyle = (style, colorClass) => {
//     const isSelected = selectedStyle === style
//     return `
//       relative p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-200
//       ${isSelected 
//         ? `${colorClass} bg-gray-800 shadow-xl scale-[1.02]` 
//         : 'border-white/10 bg-white/5 hover:bg-white/10'
//       }
//     `
//   }

//   return (
//     <div className="w-full">
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {/* Gentle */}
//         <div onClick={() => handleStyleClick('gentle')} className={getCardStyle('gentle', 'border-green-500')}>
//           <div className="text-2xl mb-1">🌱</div>
//           <div className="font-bold text-white">Gentle</div>
//           <div className="text-xs text-gray-400">Supportive</div>
//         </div>

//         {/* Balanced */}
//         <div onClick={() => handleStyleClick('balanced')} className={getCardStyle('balanced', 'border-blue-500')}>
//           {!selectedStyle === 'balanced' && <span className="absolute top-2 right-2 text-[10px] bg-blue-600 text-white px-2 rounded font-bold">PRO</span>}
//           <div className="text-2xl mb-1">⚖️</div>
//           <div className="font-bold text-white">Balanced</div>
//           <div className="text-xs text-gray-400">Direct</div>
//         </div>

//         {/* Tough Love */}
//         <div onClick={() => handleStyleClick('tough')} className={getCardStyle('tough', 'border-red-500')}>
//           {!selectedStyle === 'tough' && <span className="absolute top-2 right-2 text-[10px] bg-red-600 text-white px-2 rounded font-bold">PRO</span>}
//           <div className="text-2xl mb-1">🔥</div>
//           <div className="font-bold text-white">Tough Love</div>
//           <div className="text-xs text-gray-400">Ruthless</div>
//         </div>
//       </div>

//       {modalTier && (
//         <PricingModal 
//           tier={modalTier} 
//           onClose={() => setModalTier(null)}
//           onConfirm={handlePaymentSuccess}
//         />
//       )}
//     </div>
//   )
// }