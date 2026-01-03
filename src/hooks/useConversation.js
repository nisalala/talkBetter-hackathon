// src/hooks/useConversation.js

import { useState, useRef, useCallback, useEffect } from 'react'

export default function useConversation(scenario, maxTurns = 7) {
  const [messages, setMessages] = useState([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationEnded, setConversationEnded] = useState(false)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const audioRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllAudio()
      cleanupRecording()
    }
  }, [])

  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsAISpeaking(false)
  }, [])

  const cleanupRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        // Ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
  }, [])

  // Get AI response based on conversation context
  const getAIResponse = useCallback(async (userMessage = null) => {
    // Safety check for scenario
    if (!scenario) {
      console.error('No scenario provided')
      setError('No scenario selected')
      return null
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Build conversation history
      const conversationHistory = messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }))

      // Add user's new message if provided
      if (userMessage) {
        conversationHistory.push({
          role: 'user',
          content: userMessage,
        })
      }

      const response = await fetch('/api/conversation/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: {
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
            aiRole: scenario.aiRole || 'conversation partner',
            context: scenario.context || scenario.description,
            openingLine: scenario.openingLine,
          },
          conversationHistory,
          currentTurn: currentTurn + 1,
          maxTurns,
          isOpening: conversationHistory.length === 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API error:', errorData)
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      return data.response

    } catch (err) {
      console.error('AI response error:', err)
      setError('Failed to get AI response. Please try again.')
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [scenario, messages, currentTurn, maxTurns])

  // Speak AI message using browser TTS
  const speakAIMessage = useCallback(async (text) => {
    setIsAISpeaking(true)

    return new Promise((resolve) => {
      // Use browser's speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.0
        utterance.pitch = 1.0
        
        // Get a good voice
        const voices = speechSynthesis.getVoices()
        const preferredVoice = voices.find(v => 
          v.name.includes('Google') || 
          v.name.includes('Samantha') || 
          v.name.includes('Daniel')
        ) || voices[0]
        
        if (preferredVoice) {
          utterance.voice = preferredVoice
        }

        utterance.onend = () => {
          setIsAISpeaking(false)
          resolve()
        }

        utterance.onerror = () => {
          setIsAISpeaking(false)
          resolve()
        }

        // Store reference for stopping
        audioRef.current = { 
          pause: () => speechSynthesis.cancel(),
          currentTime: 0 
        }

        speechSynthesis.speak(utterance)
      } else {
        // Fallback: just wait a bit
        setTimeout(() => {
          setIsAISpeaking(false)
          resolve()
        }, 2000)
      }
    })
  }, [])

  // Add message to conversation
  const addMessage = useCallback((role, text) => {
    const newMessage = {
      id: `${role}-${Date.now()}`,
      role,
      text,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage
  }, [])

  // Start the conversation (AI speaks first)
  const startConversation = useCallback(async () => {
    if (!scenario) {
      setError('No scenario selected')
      return
    }

    setError(null)
    setMessages([])
    setCurrentTurn(0)
    setConversationEnded(false)

    // Get AI's opening line
    const aiResponse = scenario.openingLine || await getAIResponse()
    
    if (aiResponse) {
      addMessage('ai', aiResponse)
      setCurrentTurn(1)
      await speakAIMessage(aiResponse)
    }
  }, [scenario, getAIResponse, addMessage, speakAIMessage])

  // Start recording user's response
  const startRecording = useCallback(async () => {
    if (isAISpeaking || isProcessing || conversationEnded) return

    setError(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Determine mime type
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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsUserSpeaking(true)

    } catch (err) {
      console.error('Recording error:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }, [isAISpeaking, isProcessing, conversationEnded])

  // Stop recording and process
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return
    }

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        setIsUserSpeaking(false)
        setIsProcessing(true)

        try {
          // Create audio blob
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })

          // Check if we have enough audio
          if (audioBlob.size < 1000) {
            setError('Recording too short. Please try again.')
            setIsProcessing(false)
            resolve()
            return
          }

          // Transcribe the audio
          const formData = new FormData()
          const extension = mimeType.includes('webm') ? 'webm' : 
                           mimeType.includes('mp4') ? 'mp4' : 'ogg'
          formData.append('audio', audioBlob, `recording.${extension}`)

          const transcribeResponse = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!transcribeResponse.ok) {
            throw new Error('Transcription failed')
          }

          const { text: userTranscript } = await transcribeResponse.json()

          if (!userTranscript || userTranscript.trim().length === 0) {
            setError('Could not understand audio. Please try again.')
            setIsProcessing(false)
            resolve()
            return
          }

          // Add user message
          addMessage('user', userTranscript)

          // Check if we've reached max turns
          const newTurn = currentTurn + 1
          setCurrentTurn(newTurn)

          if (newTurn >= maxTurns) {
            setConversationEnded(true)
            setIsProcessing(false)
            resolve()
            return
          }

          // Get AI response
          const aiResponse = await getAIResponse(userTranscript)

          if (aiResponse) {
            addMessage('ai', aiResponse)
            setCurrentTurn(prev => prev + 1)
            await speakAIMessage(aiResponse)
          }

          resolve()

        } catch (err) {
          console.error('Processing error:', err)
          setError('Failed to process response. Please try again.')
        } finally {
          setIsProcessing(false)
          cleanupRecording()
        }
      }

      // Stop the recorder
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        console.error('Error stopping recorder:', e)
        setIsUserSpeaking(false)
        setIsProcessing(false)
        resolve()
      }

      // Stop the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    })
  }, [currentTurn, maxTurns, addMessage, getAIResponse, speakAIMessage, cleanupRecording])

  // Stop AI speaking
  const stopAISpeaking = useCallback(() => {
    stopAllAudio()
  }, [stopAllAudio])

  // End conversation early
  const endConversation = useCallback(() => {
    stopAllAudio()
    cleanupRecording()
    setConversationEnded(true)
    setIsUserSpeaking(false)
    setIsProcessing(false)
  }, [stopAllAudio, cleanupRecording])

  // Reset conversation
  const resetConversation = useCallback(() => {
    stopAllAudio()
    cleanupRecording()
    setMessages([])
    setCurrentTurn(0)
    setConversationEnded(false)
    setError(null)
    setIsUserSpeaking(false)
    setIsProcessing(false)
    setIsAISpeaking(false)
  }, [stopAllAudio, cleanupRecording])

  return {
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
    stopAISpeaking,
    endConversation,
    resetConversation,
  }
}