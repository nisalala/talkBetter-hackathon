// src/app/api/analyze-conversation/route.js

import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { messages, scenario, duration } = await request.json()

    // Separate user and AI messages
    const userMessages = messages.filter(m => m.role === 'user')
    const aiMessages = messages.filter(m => m.role === 'ai')

    // Calculate basic metrics
    const userText = userMessages.map(m => m.text).join(' ')
    const wordCount = userText.split(/\s+/).filter(w => w.length > 0).length
    const avgWordsPerResponse = Math.round(wordCount / userMessages.length)
    
    // Count filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'honestly', 'right']
    let fillerCount = 0
    fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      const matches = userText.match(regex)
      if (matches) fillerCount += matches.length
    })

    // Format conversation for analysis
    const conversationText = messages.map(m => 
      `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.text}`
    ).join('\n\n')

    const systemPrompt = `You are an expert communication coach analyzing a practice conversation.

SCENARIO: ${scenario.name}
AI ROLE: ${scenario.aiRole}

CONVERSATION:
${conversationText}

Analyze this conversation and provide detailed feedback. Return your analysis as JSON with this exact structure:
{
  "overallScore": <number 0-100>,
  "scores": {
    "relevance": <number 0-100>,
    "clarity": <number 0-100>,
    "engagement": <number 0-100>,
    "adaptability": <number 0-100>,
    "confidence": <number 0-100>
  },
  "strengths": [<3-4 specific things they did well with examples>],
  "improvements": [<3-4 specific areas to improve with actionable advice>],
  "conversationFlow": {
    "score": <number 0-100>,
    "feedback": "<how well they maintained conversation flow>"
  },
  "questionHandling": {
    "score": <number 0-100>,
    "feedback": "<how well they answered and asked questions>"
  },
  "keyMoments": [
    {
      "quote": "<something they said>",
      "feedback": "<what was good or could be improved>",
      "type": "strength" | "improvement"
    }
  ],
  "overallFeedback": "<2-3 sentence summary of their performance>",
  "recommendedFocus": "<the ONE thing they should focus on most>"
}

Be specific and reference actual things they said. Be encouraging but honest.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Updated to use llama-3.3-70b-versatile (new model)
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analyze this conversation and return the JSON analysis.' },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error('Analysis failed')
    }

    const data = await response.json()
    let analysis
    
    try {
      const content = data.choices[0]?.message?.content || '{}'
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch (e) {
      console.error('Failed to parse analysis:', e)
      analysis = {
        overallScore: 70,
        scores: { relevance: 70, clarity: 70, engagement: 70, adaptability: 70, confidence: 70 },
        strengths: ['Completed the conversation'],
        improvements: ['Continue practicing for more detailed feedback'],
        overallFeedback: 'Good effort! Keep practicing to improve.',
      }
    }

    // Add metrics
    analysis.metrics = {
      totalMessages: messages.length,
      userResponses: userMessages.length,
      wordCount,
      avgWordsPerResponse,
      fillerWords: fillerCount,
      duration,
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    )
  }
}