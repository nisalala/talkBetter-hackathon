'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export default function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const pausedTimeRef = useRef(0)
  const streamRef = useRef(null)

  // Check if browser supports audio recording
  useEffect(() => {
    const checkSupport = () => {
      if (typeof window === 'undefined') {
        return false
      }
      
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Your browser does not support audio recording. Please use Chrome, Firefox, or Safari.')
        return false
      }

      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1'
      
      if (!isSecure) {
        setError('Audio recording requires a secure connection (HTTPS).')
        return false
      }

      return true
    }

    setIsSupported(checkSupport())
  }, [])

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedTimeRef.current * 1000
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setDuration(elapsed)
    }, 100)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    // Check if we're in browser
    if (typeof window === 'undefined') {
      setError('Recording is not available on the server.')
      return
    }

    // Check if mediaDevices is available
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Your browser does not support audio recording. Please use Chrome, Firefox, or Safari.')
      return
    }

    try {
      setError(null)
      chunksRef.current = []
      pausedTimeRef.current = 0
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })

      streamRef.current = stream

      // Try to use webm, fallback to mp4
      let mimeType = 'audio/webm'
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setError('Recording error occurred. Please try again.')
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setIsPaused(false)
      setDuration(0)
      startTimer()
    } catch (err) {
      console.error('Error starting recording:', err)
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please allow microphone access and try again.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Microphone is in use by another application. Please close other apps and try again.')
      } else {
        setError('Could not access microphone. Please check permissions and try again.')
      }
    }
  }, [startTimer])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
      } catch (err) {
        console.error('Error stopping recording:', err)
      }
      setIsRecording(false)
      setIsPaused(false)
      stopTimer()
    }
  }, [isRecording, stopTimer])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      try {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        pausedTimeRef.current = duration
        stopTimer()
      } catch (err) {
        console.error('Error pausing recording:', err)
      }
    }
  }, [isRecording, isPaused, duration, stopTimer])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      try {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        startTimer()
      } catch (err) {
        console.error('Error resuming recording:', err)
      }
    }
  }, [isRecording, isPaused, startTimer])

  const resetRecording = useCallback(() => {
    // Stop any ongoing recording
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
      } catch (err) {
        console.error('Error stopping recording during reset:', err)
      }
    }

    // Stop any active stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    // Revoke audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    // Reset all state
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setError(null)
    setIsRecording(false)
    setIsPaused(false)
    chunksRef.current = []
    pausedTimeRef.current = 0
    stopTimer()
  }, [audioUrl, isRecording, stopTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  return {
    isRecording,
    isPaused,
    audioBlob,
    audioUrl,
    duration,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  }
}