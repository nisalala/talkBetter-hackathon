// src/hooks/useConversation.js

import { useState, useCallback, useRef } from 'react'

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
  const speechSynthRef = useRef(null)

  // Initialize conversation with AI's opening line
  const startConversation = useCallback(() => {
    const openingMessage = {
      id: Date.now(),
      role: 'ai',
      text: scenario.openingLine,
      timestamp: Date.now(),
    }
    setMessages([openingMessage])
    setCurrentTurn(1)
    
    // Speak the opening line
    speakText(scenario.openingLine)
  }, [scenario])

  // Text-to-Speech for AI responses
  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Get voices and select a good one
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices()
        const preferredVoice = voices.find(v =>
          v.name.includes('Google US English') ||
          v.name.includes('Samantha') ||
          v.name.includes('Microsoft Zira') ||
          (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0]
        
        if (preferredVoice) {
          utterance.voice = preferredVoice
        }
      }

      if (window.speechSynthesis.getVoices().length > 0) {
        setVoice()
      } else {
        window.speechSynthesis.onvoiceschanged = setVoice
      }

      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.volume = 1

      utterance.onstart = () => setIsAISpeaking(true)
      utterance.onend = () => setIsAISpeaking(false)
      utterance.onerror = () => setIsAISpeaking(false)

      speechSynthRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // Stop AI from speaking
  const stopAISpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsAISpeaking(false)
    }
  }, [])

  // Start recording user's response
  const startRecording = useCallback(async () => {
    try {
      // Stop AI if still speaking
      stopAISpeaking()
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsUserSpeaking(true)
      setError(null)
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access.')
      console.error('Recording error:', err)
    }
  }, [stopAISpeaking])

  // Stop recording and process user's response
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        setIsUserSpeaking(false)
        setIsProcessing(true)

        try {
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorderRef.current.mimeType 
          })

          // Transcribe user's audio
          const formData = new FormData()
          formData.append('audio', audioBlob, 'response.webm')

          const transcribeRes = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!transcribeRes.ok) throw new Error('Transcription failed')

          const { text: userText } = await transcribeRes.json()

          // Add user message
          const userMessage = {
            id: Date.now(),
            role: 'user',
            text: userText,
            timestamp: Date.now(),
          }
          
          setMessages(prev => [...prev, userMessage])

          // Check if we've reached max turns
          if (currentTurn >= maxTurns) {
            setConversationEnded(true)
            setIsProcessing(false)
            resolve(userText)
            return
          }

          // Get AI's response
          const aiResponse = await getAIResponse([...messages, userMessage])
          
          // Add AI message
          const aiMessage = {
            id: Date.now() + 1,
            role: 'ai',
            text: aiResponse,
            timestamp: Date.now(),
          }
          
          setMessages(prev => [...prev, aiMessage])
          setCurrentTurn(prev => prev + 1)
          
          // Speak AI's response
          speakText(aiResponse)
          
          resolve(userText)
        } catch (err) {
          setError('Failed to process your response. Please try again.')
          console.error('Processing error:', err)
        } finally {
          setIsProcessing(false)
        }

        // Stop all tracks
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.stop()
    })
  }, [messages, currentTurn, maxTurns, speakText])

  // Get AI's contextual response
  const getAIResponse = async (conversationHistory) => {
    const response = await fetch('/api/conversation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: {
          aiRole: scenario.aiRole,
          context: scenario.context,
        },
        messages: conversationHistory,
        turnNumber: currentTurn,
        maxTurns: maxTurns,
      }),
    })

    if (!response.ok) throw new Error('Failed to get AI response')

    const data = await response.json()
    return data.response
  }

  // End conversation early
  const endConversation = useCallback(() => {
    stopAISpeaking()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    setConversationEnded(true)
    setIsUserSpeaking(false)
    setIsAISpeaking(false)
  }, [stopAISpeaking])

  // Reset conversation
  const resetConversation = useCallback(() => {
    stopAISpeaking()
    setMessages([])
    setCurrentTurn(0)
    setConversationEnded(false)
    setError(null)
  }, [stopAISpeaking])

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
    endConversation,
    resetConversation,
    stopAISpeaking,
  }
}