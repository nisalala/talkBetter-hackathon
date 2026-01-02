import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio')

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert to format Groq expects
    const groqFormData = new FormData()
    groqFormData.append('file', audioFile, 'recording.webm')
    groqFormData.append('model', 'whisper-large-v3')
    groqFormData.append('response_format', 'json')
    groqFormData.append('language', 'en')

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Groq API error:', errorData)
      return NextResponse.json(
        { error: 'Transcription failed', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      text: data.text,
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}