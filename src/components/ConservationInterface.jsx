// src/components/ConversationInterface.jsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useConversation from "@/hooks/useConversation";
import { getScenariosByMode } from "@/utils/conversationScenarios";
import ConversationBubble from "@/components/ConversationBubble";
import AIAvatar from "@/components/AIAvatar";
import { modeQuestions } from "@/utils/modeQuestions";

export default function ConversationInterface({
  mode,
  isFreePractice = false,
}) {
  const router = useRouter();

  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Track if conversation has been started to prevent double-start
  const hasStartedRef = useRef(false);

  // Get mode data
  const modeData = modeQuestions[mode];

  // Load scenarios for the current mode - Reset everything when mode changes
  useEffect(() => {
    const modeScenarios = getScenariosByMode(mode);
    setScenarios(modeScenarios);
    setSelectedScenario(null);
    setStartTime(null);
    setIsStarting(false);
    hasStartedRef.current = false;
  }, [mode]);

  const {
    messages,
    currentTurn,
    maxTurns,
    isAISpeaking,
    isUserSpeaking,
    isProcessing,
    conversationEnded,
    error,
    startConversation,
    startRecording,
    stopRecording,
    endConversation,
    stopAISpeaking,
    resetConversation,
  } = useConversation(selectedScenario, 7);

  // Handle scenario selection - Auto-start conversation
  const handleSelectScenario = (scenario) => {
    setSelectedScenario(scenario);
    setStartTime(Date.now());
    setIsStarting(true);
    hasStartedRef.current = false;
  };

  // Auto-start conversation when scenario is selected
  useEffect(() => {
    if (selectedScenario && isStarting && !hasStartedRef.current) {
      hasStartedRef.current = true;
      
      // Small delay to ensure state is set and hook is ready
      const timer = setTimeout(async () => {
        try {
          await startConversation();
        } catch (err) {
          console.error("Failed to start conversation:", err);
        } finally {
          setIsStarting(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedScenario, isStarting, startConversation]);

  const handleBack = () => {
    setSelectedScenario(null);
    setStartTime(null);
    setIsStarting(false);
    hasStartedRef.current = false;
    if (resetConversation) resetConversation();
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    try {
      const duration = Math.round((Date.now() - startTime) / 1000);

      const response = await fetch("/api/analyze-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          scenario: selectedScenario,
          duration,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const analysis = await response.json();

      // Store results
      const results = {
        type: "conversation",
        messages,
        scenario: selectedScenario,
        mode,
        duration,
        analysis,
        timestamp: Date.now(),
      };

      sessionStorage.setItem("talkbetter_results", JSON.stringify(results));
      router.push("/results/conversation");
    } catch (err) {
      console.error("Analysis error:", err);
      alert("Failed to analyze conversation. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTryAgain = () => {
    hasStartedRef.current = false;
    setIsStarting(true);
    setStartTime(Date.now());
    if (resetConversation) resetConversation();
    
    // Restart conversation after reset
    setTimeout(async () => {
      try {
        await startConversation();
      } catch (err) {
        console.error("Failed to restart conversation:", err);
      } finally {
        setIsStarting(false);
      }
    }, 100);
  };

  // Scenario Selection Screen
  if (!selectedScenario) {
    return (
      <div className="text-center">
        {/* Header */}
        <div className="mb-6 pt-2">
          {modeData && !isFreePractice && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{modeData.icon}</span>
              <h3 className="text-lg font-bold text-white">{modeData.name}</h3>
            </div>
          )}
          <h3 className="text-xl font-bold text-white mb-1">
            💬 Two-Way Conversation
          </h3>
          <p className="text-gray-400 text-sm">
            Choose a scenario to practice with AI
          </p>
        </div>

        {/* Scenarios Grid */}
        {scenarios.length > 0 ? (
          <div className="grid gap-3 max-w-lg mx-auto">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                className="p-4 rounded-xl bg-white/5 border border-white/10 
                         hover:bg-white/10 hover:border-indigo-500/50
                         text-left transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 
                                flex items-center justify-center text-xl flex-shrink-0"
                  >
                    🎭
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {scenario.name}
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {scenario.description}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="text-gray-400">Talking to:</span> {scenario.aiRole || 'AI Partner'}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 text-gray-400">
            <div className="text-4xl mb-3">🚧</div>
            <p>No scenarios available for this mode yet.</p>
            <p className="text-sm mt-1">
              Try a different mode or check back later!
            </p>
          </div>
        )}
      </div>
    );
  }

  // Active Conversation Screen (starts automatically after scenario selection)
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Back to scenarios"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h3 className="text-lg font-bold text-white">
              {selectedScenario.name}
            </h3>
            <p className="text-xs text-gray-400">
              with {selectedScenario.aiRole || 'AI Partner'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{currentTurn}/{maxTurns}</span>
          <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(currentTurn / maxTurns) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Avatar */}
      <div className="flex justify-center mb-4">
        <AIAvatar
          isSpeaking={isAISpeaking}
          isListening={isUserSpeaking}
          isThinking={isProcessing || isStarting}
          size="md"
        />
      </div>

      {/* Conversation Messages */}
      <div className="glass rounded-xl p-4 mb-4 max-h-[300px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="mt-2">AI is starting the conversation...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <ConversationBubble
                key={message.id}
                message={message}
                isLatest={message.id === messages[messages.length - 1]?.id}
              />
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center text-sm">
          {error}
        </div>
      )}

      {/* Controls */}
      {!conversationEnded ? (
        <div className="space-y-3">
          {/* Main action button */}
          <div className="flex justify-center">
            {isAISpeaking ? (
              <button
                onClick={stopAISpeaking}
                className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 
                         text-white font-medium transition-all flex items-center gap-2"
              >
                <span>⏭️</span>
                Skip to respond
              </button>
            ) : isUserSpeaking ? (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 
                         text-white transition-all flex items-center justify-center
                         shadow-lg shadow-red-500/30 animate-pulse"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={isProcessing || isStarting || messages.length === 0}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                         hover:from-indigo-400 hover:to-purple-400
                         text-white transition-all flex items-center justify-center
                         shadow-lg shadow-indigo-500/30
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>
            )}
          </div>

          {/* Status text */}
          <p className="text-center text-gray-400 text-sm">
            {isStarting && "⏳ Starting conversation..."}
            {!isStarting && isAISpeaking && "🔊 AI is speaking... Click to skip"}
            {!isStarting && isUserSpeaking && "🎤 Recording... Click to stop"}
            {!isStarting && isProcessing && "⏳ Processing your response..."}
            {!isStarting && !isAISpeaking && !isUserSpeaking && !isProcessing && messages.length === 0 && "⏳ Waiting for AI to start..."}
            {!isStarting && !isAISpeaking && !isUserSpeaking && !isProcessing && messages.length > 0 && "🎤 Click to respond"}
          </p>

          {/* End early button */}
          {messages.length >= 2 && (
            <button
              onClick={endConversation}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 
                       text-gray-400 hover:text-white font-medium transition-all text-sm"
            >
              End & Analyze
            </button>
          )}
        </div>
      ) : (
        /* Conversation ended */
        <div className="space-y-3">
          <div className="text-center py-3">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="text-lg font-bold text-white">
              Conversation Complete!
            </h3>
            <p className="text-gray-400 text-sm">Ready to see how you did?</p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                     text-white font-semibold
                     hover:from-indigo-400 hover:to-purple-400 transition-all
                     shadow-lg shadow-indigo-500/25
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Analyzing...
              </>
            ) : (
              <>📊 Get Detailed Analysis</>
            )}
          </button>

          <button
            onClick={handleTryAgain}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 
                     text-gray-400 hover:text-white font-medium transition-all text-sm"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}