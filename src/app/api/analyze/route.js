import { NextResponse } from 'next/server'
import { countFillerWords } from '@/utils/fillerWords'
import { calculateWPM, getWPMRating } from '@/utils/paceCalculator'
import { getAnalysisPrompt } from '@/utils/modePrompts'
import { getDifficultyModifier } from '@/utils/difficultyLevels'

export async function POST(request) {
  try {
    const { transcript, duration, mode, difficulty, question } = await request.json()

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set!')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Calculate metrics
    const wpm = calculateWPM(transcript, duration)
    const wpmRating = getWPMRating(wpm)
    const fillerAnalysis = countFillerWords(transcript)
    const wordCount = transcript.trim().split(/\s+/).length

    // Get prompts
    const basePrompt = getAnalysisPrompt(
      mode, 
      transcript, 
      wpm, 
      fillerAnalysis.total, 
      duration
    )
    
    const difficultyModifier = getDifficultyModifier(difficulty || 'balanced')
    
    // Add question context if available
    const questionContext = question 
      ? `\n\nTHE PROMPT/QUESTION THEY WERE RESPONDING TO:\n"${question.text}"\nRecommended duration: ${question.duration} seconds\n\nEvaluate how well they addressed this specific prompt.`
      : ''

    const fullPrompt = `${difficultyModifier}\n\n${basePrompt}${questionContext}`

    console.log('Sending request to Groq...')

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Groq API error status:', response.status)
      console.error('Groq API error body:', errorData)
      return NextResponse.json(
        { error: 'Analysis failed', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Groq response received successfully')
    
    const aiContent = data.choices[0]?.message?.content

    // Parse AI response
    let aiAnalysis
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent)
      aiAnalysis = {
        overallScore: 70,
        scores: {},
        strengths: ['Analysis completed', 'Speech recorded successfully'],
        improvements: ['Try recording again for detailed feedback'],
        rewrittenExample: '',
      }
    }

    return NextResponse.json({
      ...aiAnalysis,
      metrics: {
        wpm,
        wpmRating,
        wordCount,
        duration,
        fillerWords: fillerAnalysis,
      },
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}