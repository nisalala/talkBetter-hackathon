import ModeSelector from '@/components/ModeSelector'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Speak Better.
          </span>
          <br />
          <span className="text-white">Communicate Confidently.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Record yourself speaking, get instant AI-powered feedback on clarity, 
          confidence, and impact. Choose a mode to get started.
        </p>
      </div>

      {/* How it works */}
      <div className="flex flex-wrap justify-center gap-8 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            1
          </div>
          <span className="text-gray-300">Choose a mode</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            2
          </div>
          <span className="text-gray-300">Record yourself</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            3
          </div>
          <span className="text-gray-300">Get AI feedback</span>
        </div>
      </div>

      {/* Mode Selector */}
      <ModeSelector />

      {/* Footer info */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          🔒 Your recordings are processed securely and never stored
        </p>
      </div>
    </div>
  )
}