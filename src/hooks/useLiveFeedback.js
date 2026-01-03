// src/hooks/useLiveFeedback.js

import { useState, useRef, useCallback, useEffect } from 'react'

const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'actually', 
  'literally', 'so', 'right', 'okay', 'i mean', 'kind of',
  'sort of', 'you see', 'well', 'anyway'
]

// Minimum audio size to send (in bytes) - prevents invalid file errors
const MIN_AUDIO_SIZE = 10000 // ~10KB minimum

export default function useLiveFeedback({ 
  targetDuration = 60,
  isRecording = false,
  currentDuration = 0,
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
  const allChunksRef = useRef([]) // Store ALL audio chunks for cumulative sending

  // Cooldowns
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
      setCurrentFeedback({ type, message, id: Date.now(), priority })
    }
  }, [canShowFeedback])

  const dismissFeedback = useCallback(() => {
    setCurrentFeedback(null)
  }, [])

  // Analyze transcript
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

    setStats({
      wordCount,
      wpm,
      fillerCount: totalFillers,
      fillerWords: fillerCounts,
      sentenceCount,
      avgWordsPerSentence,
    })

    // PACE FEEDBACK
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
        showFeedback('pace_improved', `Great adjustment! ${wpm} WPM is perfect! 👏`)
      } else if (currentPaceStatus === 'normal' && previousPaceStatus) {
        showFeedback('pace_improved', `Better pace now at ${wpm} WPM!`)
      }
      lastPaceStatusRef.current = currentPaceStatus
    }

    // FILLER WORDS FEEDBACK
    if (totalFillers > 0) {
      const mostUsed = Object.entries(fillerCounts).sort((a, b) => b[1] - a[1])[0]
      
      if (mostUsed) {
        const [word, count] = mostUsed
        
        if (count >= 5 && canShowFeedback('filler_alert')) {
          showFeedback('filler_alert', `🚨 "${word}" used ${count} times! Try pausing instead.`, 'high')
        } else if (count >= 3 && canShowFeedback('filler_words')) {
          showFeedback('filler_words', `You've said "${word}" ${count} times. Be mindful!`)
        }
      }
    }

    // SENTENCE LENGTH FEEDBACK
    if (avgWordsPerSentence > 30 && canShowFeedback('rambling')) {
      showFeedback('rambling', `Sentences are long (~${avgWordsPerSentence} words). Break it up!`)
    }

    // POSITIVE REINFORCEMENT
    if (duration > 25 && 
        totalFillers === 0 && 
        wpm >= 120 && wpm <= 150 && 
        canShowFeedback('great_streak')) {
      showFeedback('great_streak', `🌟 Excellent! Perfect pace, no fillers!`)
    }

  }, [showFeedback, canShowFeedback])

  // Time-based feedback
  useEffect(() => {
    if (!isRecording || !targetDuration || targetDuration <= 0) return

    const timeRemaining = targetDuration - currentDuration
    const percentComplete = (currentDuration / targetDuration) * 100

    if (percentComplete >= 48 && percentComplete <= 52 && !halfwayShownRef.current) {
      halfwayShownRef.current = true
      showFeedback('time_halfway', `⏰ Halfway! ${Math.round(timeRemaining)} seconds left.`, 'high')
    }
    
    if (timeRemaining <= 30 && timeRemaining > 28 && !timeWarningsShownRef.current.has(30)) {
      timeWarningsShownRef.current.add(30)
      showFeedback('time_warning', `⏱️ 30 seconds! Start wrapping up.`, 'high')
    }
    
    if (timeRemaining <= 10 && timeRemaining > 8 && !timeWarningsShownRef.current.has(10)) {
      timeWarningsShownRef.current.add(10)
      showFeedback('time_warning', `⏱️ 10 seconds! Finish strong!`, 'high')
    }

  }, [currentDuration, targetDuration, isRecording, showFeedback])

  // Start live transcription
  const startLiveTranscription = useCallback(async () => {
    if (isRunningRef.current) return
    isRunningRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Try different mime types
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
      allChunksRef.current = [] // Reset chunks

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          allChunksRef.current.push(event.data)
        }
      }

      // Process every 5 seconds with CUMULATIVE audio
      const processInterval = setInterval(async () => {
        if (allChunksRef.current.length === 0 || isProcessingRef.current || !isRunningRef.current) {
          return
        }

        // Create blob from ALL chunks so far (cumulative)
        const audioBlob = new Blob(allChunksRef.current, { type: mimeType })
        
        // Skip if audio is too small
        if (audioBlob.size < MIN_AUDIO_SIZE) {
          console.log(`Audio too small (${audioBlob.size} bytes), waiting for more...`)
          return
        }

        isProcessingRef.current = true

        try {
          const formData = new FormData()
          
          // Use appropriate file extension
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
              // Replace entire transcript (since we send cumulative audio)
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
      }, 5000) // Every 5 seconds

      // Start recording - collect data every second
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
    setAllTranscript('')
    setStats({ 
      wordCount: 0, 
      wpm: 0, 
      fillerCount: 0, 
      fillerWords: {}, 
      sentenceCount: 0,
      avgWordsPerSentence: 0,
    })
    setCurrentFeedback(null)
    
    lastFeedbackTimeRef.current = {}
    lastPaceStatusRef.current = null
    halfwayShownRef.current = false
    timeWarningsShownRef.current = new Set()
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