// src/hooks/useLiveFeedback.js

import { useState, useRef, useCallback, useEffect } from 'react'

const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'actually', 
  'literally', 'so', 'right', 'okay', 'i mean', 'kind of',
  'sort of', 'you see', 'well', 'anyway'
]

// Minimum audio size to send (in bytes) - prevents invalid file errors
const MIN_AUDIO_SIZE = 10000 // ~10KB minimum

// Keywords for context-awareness per mode
const MODE_KEYWORDS = {
  pitch: {
    keywords: ['product', 'service', 'solution', 'problem', 'customer', 'market', 'business', 'startup', 'idea', 'value', 'offer', 'price', 'benefit', 'feature', 'unique', 'better', 'help', 'solve', 'need', 'buy', 'sell', 'invest', 'revenue', 'growth', 'team', 'opportunity', 'million', 'percent', 'users', 'customers', 'app', 'platform', 'technology'],
    offTopicPhrases: ['my favorite movie', 'what i ate', 'the weather today', 'my pet', 'last night i watched', 'my vacation'],
    contextHint: 'pitching your product or idea',
  },
  interview: {
    keywords: ['experience', 'worked', 'job', 'role', 'team', 'project', 'skill', 'learned', 'achieved', 'managed', 'led', 'developed', 'improved', 'challenge', 'problem', 'solution', 'goal', 'result', 'company', 'position', 'career', 'qualified', 'strength', 'weakness', 'example', 'situation', 'responsible', 'hired'],
    offTopicPhrases: ['my vacation last year', 'my favorite tv show', 'what i had for dinner', 'my pets name'],
    contextHint: 'answering interview questions',
  },
  meeting: {
    keywords: ['update', 'status', 'progress', 'project', 'deadline', 'timeline', 'task', 'action', 'decision', 'team', 'next steps', 'plan', 'goal', 'issue', 'blocker', 'help', 'need', 'review', 'feedback', 'agenda', 'priority', 'budget', 'resource', 'deliverable', 'meeting', 'discuss'],
    offTopicPhrases: ['my weekend plans', 'the game last night', 'did you see that show', 'speaking of vacations'],
    contextHint: 'discussing work updates',
  },
  date: {
    keywords: ['like', 'enjoy', 'love', 'hobby', 'interest', 'fun', 'travel', 'music', 'food', 'movie', 'book', 'family', 'friend', 'passion', 'dream', 'weekend', 'free time', 'story', 'feel', 'think', 'believe', 'favorite', 'grew up', 'childhood', 'relationship'],
    offTopicPhrases: ['quarterly report', 'synergy', 'stakeholders', 'deliverables', 'action items', 'kpi', 'roi'],
    contextHint: 'having a personal conversation',
  },
  difficult: {
    keywords: ['feel', 'understand', 'concern', 'issue', 'problem', 'situation', 'perspective', 'hear', 'appreciate', 'respect', 'boundary', 'need', 'want', 'expect', 'hope', 'resolve', 'solution', 'together', 'forward', 'feedback', 'honest', 'difficult', 'uncomfortable', 'apologize', 'sorry', 'frustrat'],
    offTopicPhrases: [],
    contextHint: 'addressing the difficult topic',
  },
  speech: {
    keywords: ['today', 'talk', 'share', 'story', 'message', 'point', 'important', 'imagine', 'consider', 'together', 'thank', 'welcome', 'journey', 'experience', 'learned', 'believe', 'future', 'change', 'action', 'remember', 'finally', 'conclusion', 'audience', 'listen'],
    offTopicPhrases: [],
    contextHint: 'delivering your speech',
  },
  general: {
    keywords: [],
    offTopicPhrases: [],
    contextHint: '',
  },
}

export default function useLiveFeedback({ 
  targetDuration = 60,
  isRecording = false,
  currentDuration = 0,
  mode = 'general',
  questionText = '',
}) {
  const [currentFeedback, setCurrentFeedback] = useState(null)
  const [allTranscript, setAllTranscript] = useState('')
  const [stats, setStats] = useState({
    wordCount: 0,
    wpm: 0,
    fillerCount: 0,
    fillerWords: {},
    sentenceCount: 0,
    avgWordsPerSentence: 0,
    contextScore: 100,
  })
  
  // All refs
  const lastFeedbackTimeRef = useRef({})
  const lastPaceStatusRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const isProcessingRef = useRef(false)
  const startTimeRef = useRef(Date.now())
  const transcriptChunksRef = useRef([])
  const halfwayShownRef = useRef(false)
  const timeWarningsShownRef = useRef(new Set())
  const isRunningRef = useRef(false)
  const allChunksRef = useRef([])
  const contextWarningShownRef = useRef(false)
  const modeRef = useRef(mode)
  const questionTextRef = useRef(questionText)

  // Update refs when props change
  useEffect(() => {
    modeRef.current = mode
    questionTextRef.current = questionText
  }, [mode, questionText])

  // Get mode config
  const getModeConfig = useCallback(() => {
    return MODE_KEYWORDS[modeRef.current] || MODE_KEYWORDS.general
  }, [])

  // Cooldowns (in seconds)
  const feedbackCooldowns = {
    pace_slow: 10,
    pace_fast: 10,
    pace_improved: 12,
    filler_words: 12,
    filler_alert: 8,
    time_warning: 999,
    time_halfway: 999,
    good_pace: 20,
    silence: 15,
    rambling: 15,
    great_streak: 25,
    repetition: 15,
    context_warning: 999,
    context_hint: 999,
  }

  const canShowFeedback = useCallback((type) => {
    const now = Date.now()
    const lastTime = lastFeedbackTimeRef.current[type] || 0
    const cooldown = (feedbackCooldowns[type] || 10) * 1000
    return now - lastTime > cooldown
  }, [])

  const showFeedback = useCallback((type, message, priority = 'normal') => {
    if (priority === 'high' || canShowFeedback(type)) {
      lastFeedbackTimeRef.current[type] = Date.now()
      console.log('📢 Showing feedback:', type, message)
      setCurrentFeedback({ type, message, id: Date.now(), priority })
    }
  }, [canShowFeedback])

  const dismissFeedback = useCallback(() => {
    setCurrentFeedback(null)
  }, [])

  // Calculate context relevance score
  const calculateContextScore = useCallback((transcript) => {
    const modeConfig = getModeConfig()
    const currentMode = modeRef.current
    
    if (currentMode === 'general' || !transcript || transcript.length < 50) {
      return 100
    }

    const lowerTranscript = transcript.toLowerCase()
    const words = lowerTranscript.split(/\s+/).filter(w => w.length > 0)
    
    for (const phrase of modeConfig.offTopicPhrases) {
      if (lowerTranscript.includes(phrase.toLowerCase())) {
        console.log('🚫 Off-topic phrase detected:', phrase)
        return 25
      }
    }

    let keywordMatches = 0
    const foundKeywords = []
    for (const keyword of modeConfig.keywords) {
      if (lowerTranscript.includes(keyword.toLowerCase())) {
        keywordMatches++
        foundKeywords.push(keyword)
      }
    }

    console.log(`📊 Context check - Mode: ${currentMode}, Words: ${words.length}, Keywords found: ${keywordMatches}`, foundKeywords.slice(0, 5))

    if (keywordMatches === 0 && words.length > 40) {
      return 35
    } else if (keywordMatches < 2 && words.length > 60) {
      return 50
    } else if (keywordMatches < 3 && words.length > 80) {
      return 60
    }
    
    return Math.min(100, 65 + keywordMatches * 5)
  }, [getModeConfig])

  // Analyze transcript and provide feedback - NO EMOJIS IN MESSAGES
  const analyzeAndFeedback = useCallback((fullTranscript, duration) => {
    if (!fullTranscript.trim() || duration < 5) return

    const words = fullTranscript.trim().split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length
    const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0
    
    const sentences = fullTranscript.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const sentenceCount = sentences.length
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0

    const lowerText = fullTranscript.toLowerCase()
    const fillerCounts = {}
    let totalFillers = 0
    
    FILLER_WORDS.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) {
        fillerCounts[filler] = matches.length
        totalFillers += matches.length
      }
    })

    const contextScore = calculateContextScore(fullTranscript)

    setStats({
      wordCount,
      wpm,
      fillerCount: totalFillers,
      fillerWords: fillerCounts,
      sentenceCount,
      avgWordsPerSentence,
      contextScore,
    })

    // ============================================
    // CONTEXT AWARENESS FEEDBACK - NO EMOJIS
    // ============================================
    const modeConfig = getModeConfig()
    const currentMode = modeRef.current
    
    if (currentMode !== 'general' && !contextWarningShownRef.current) {
      if (contextScore <= 35 && wordCount > 30) {
        console.log('🎯 Triggering context_warning')
        showFeedback(
          'context_warning', 
          `Off topic! Focus on ${modeConfig.contextHint}.`,
          'high'
        )
        contextWarningShownRef.current = true
      } else if (contextScore <= 50 && wordCount > 50) {
        console.log('📌 Triggering context_hint (drifting)')
        showFeedback(
          'context_hint', 
          `Stay focused on ${modeConfig.contextHint}.`,
          'high'
        )
        contextWarningShownRef.current = true
      } else if (contextScore <= 60 && wordCount > 70) {
        console.log('💡 Triggering context_hint (soft)')
        showFeedback(
          'context_hint', 
          `Include more details relevant to your ${currentMode} practice.`,
          'normal'
        )
        contextWarningShownRef.current = true
      }
    }

    if (contextScore > 75 && contextWarningShownRef.current && wordCount > 100) {
      console.log('✅ Back on track, resetting context warning flag')
      contextWarningShownRef.current = false
    }

    // ============================================
    // PACE FEEDBACK - NO EMOJIS
    // ============================================
    const previousPaceStatus = lastPaceStatusRef.current
    let currentPaceStatus = 'normal'

    if (wpm < 100 && wpm > 0) {
      currentPaceStatus = 'slow'
    } else if (wpm > 170) {
      currentPaceStatus = 'fast'
    } else if (wpm >= 120 && wpm <= 150) {
      currentPaceStatus = 'perfect'
    }

    if (currentPaceStatus !== previousPaceStatus && duration > 8 && wpm > 0) {
      if (currentPaceStatus === 'slow') {
        showFeedback('pace_slow', `Speaking a bit slow (${wpm} WPM). Pick up the pace!`)
      } else if (currentPaceStatus === 'fast') {
        showFeedback('pace_fast', `Slow down! You're at ${wpm} WPM. Take a breath.`)
      } else if (currentPaceStatus === 'perfect' && previousPaceStatus) {
        showFeedback('pace_improved', `Great adjustment! ${wpm} WPM is perfect!`)
      } else if (currentPaceStatus === 'normal' && previousPaceStatus) {
        showFeedback('pace_improved', `Better pace now at ${wpm} WPM!`)
      }
      lastPaceStatusRef.current = currentPaceStatus
    }

    // ============================================
    // FILLER WORDS FEEDBACK - NO EMOJIS
    // ============================================
    if (totalFillers > 0) {
      const mostUsed = Object.entries(fillerCounts).sort((a, b) => b[1] - a[1])[0]
      
      if (mostUsed) {
        const [word, count] = mostUsed
        
        if (count >= 5 && canShowFeedback('filler_alert')) {
          showFeedback('filler_alert', `"${word}" used ${count} times! Try pausing instead.`, 'high')
        } else if (count >= 3 && canShowFeedback('filler_words')) {
          showFeedback('filler_words', `You've said "${word}" ${count} times. Be mindful!`)
        }
      }
    }

    // ============================================
    // SENTENCE LENGTH FEEDBACK - NO EMOJIS
    // ============================================
    if (avgWordsPerSentence > 30 && canShowFeedback('rambling')) {
      showFeedback('rambling', `Sentences are long (~${avgWordsPerSentence} words). Break it up!`)
    }

    // ============================================
    // POSITIVE REINFORCEMENT - NO EMOJIS
    // ============================================
    if (duration > 25 && 
        totalFillers === 0 && 
        wpm >= 120 && wpm <= 150 && 
        contextScore >= 70 &&
        canShowFeedback('great_streak')) {
      showFeedback('great_streak', `Excellent! Perfect pace, on topic, no fillers!`)
    }

  }, [showFeedback, canShowFeedback, calculateContextScore, getModeConfig])

  // Time-based feedback - NO EMOJIS
  useEffect(() => {
    if (!isRecording || !targetDuration || targetDuration <= 0) return

    const timeRemaining = targetDuration - currentDuration
    const percentComplete = (currentDuration / targetDuration) * 100

    if (percentComplete >= 48 && percentComplete <= 52 && !halfwayShownRef.current) {
      halfwayShownRef.current = true
      showFeedback('time_halfway', `Halfway! ${Math.round(timeRemaining)} seconds left.`, 'high')
    }
    
    if (timeRemaining <= 30 && timeRemaining > 28 && !timeWarningsShownRef.current.has(30)) {
      timeWarningsShownRef.current.add(30)
      showFeedback('time_warning', `30 seconds! Start wrapping up.`, 'high')
    }
    
    if (timeRemaining <= 10 && timeRemaining > 8 && !timeWarningsShownRef.current.has(10)) {
      timeWarningsShownRef.current.add(10)
      showFeedback('time_warning', `10 seconds! Finish strong!`, 'high')
    }

  }, [currentDuration, targetDuration, isRecording, showFeedback])

  // Start live transcription
  const startLiveTranscription = useCallback(async () => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    
    console.log('🎙️ Starting live transcription for mode:', modeRef.current)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      allChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          allChunksRef.current.push(event.data)
        }
      }

      const processInterval = setInterval(async () => {
        if (allChunksRef.current.length === 0 || isProcessingRef.current || !isRunningRef.current) {
          return
        }

        const audioBlob = new Blob(allChunksRef.current, { type: mimeType })
        
        if (audioBlob.size < MIN_AUDIO_SIZE) {
          console.log(`Audio too small (${audioBlob.size} bytes), waiting for more...`)
          return
        }

        isProcessingRef.current = true

        try {
          const formData = new FormData()
          
          const extension = mimeType.includes('webm') ? 'webm' : 
                           mimeType.includes('mp4') ? 'mp4' : 
                           mimeType.includes('ogg') ? 'ogg' : 'webm'
          formData.append('audio', audioBlob, `recording.${extension}`)

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            const { text } = await response.json()
            if (text && text.trim()) {
              console.log('📝 Transcription received:', text.substring(0, 100) + '...')
              setAllTranscript(text)
              
              const actualDuration = Math.round((Date.now() - startTimeRef.current) / 1000)
              analyzeAndFeedback(text, actualDuration)
            }
          } else {
            console.log('Transcription failed, will retry with more audio')
          }
        } catch (error) {
          console.error('Transcription error:', error)
        } finally {
          isProcessingRef.current = false
        }
      }, 5000)

      mediaRecorder.start(1000)
      mediaRecorderRef.current.processInterval = processInterval

    } catch (error) {
      console.error('Failed to start live transcription:', error)
      isRunningRef.current = false
    }
  }, [analyzeAndFeedback])

  // Stop live transcription
  const stopLiveTranscription = useCallback(() => {
    isRunningRef.current = false
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.processInterval) {
        clearInterval(mediaRecorderRef.current.processInterval)
      }
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch (e) {
          // Ignore
        }
      }
      mediaRecorderRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    allChunksRef.current = []
  }, [])

  // Public start function
  const startFeedback = useCallback(() => {
    console.log('🚀 Starting feedback for mode:', modeRef.current)
    
    setAllTranscript('')
    setStats({ 
      wordCount: 0, 
      wpm: 0, 
      fillerCount: 0, 
      fillerWords: {}, 
      sentenceCount: 0,
      avgWordsPerSentence: 0,
      contextScore: 100,
    })
    setCurrentFeedback(null)
    
    lastFeedbackTimeRef.current = {}
    lastPaceStatusRef.current = null
    halfwayShownRef.current = false
    timeWarningsShownRef.current = new Set()
    contextWarningShownRef.current = false
    transcriptChunksRef.current = []
    allChunksRef.current = []
    startTimeRef.current = Date.now()
    isProcessingRef.current = false
    
    startLiveTranscription()
  }, [startLiveTranscription])

  // Public stop function
  const stopFeedback = useCallback(() => {
    stopLiveTranscription()
  }, [stopLiveTranscription])

  return {
    currentFeedback,
    dismissFeedback,
    stats,
    startFeedback,
    stopFeedback,
    allTranscript,
  }
}