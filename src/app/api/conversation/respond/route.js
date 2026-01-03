// src/app/api/conversation/respond/route.js

import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { 
      scenario, 
      conversationHistory, 
      currentTurn, 
      maxTurns, 
      isOpening 
    } = await request.json()

    // Safety check
    if (!scenario) {
      return NextResponse.json({ error: 'No scenario provided' }, { status: 400 })
    }

    // If it's the opening and we have an opening line, use it
    if (isOpening && scenario.openingLine) {
      return NextResponse.json({ response: scenario.openingLine })
    }

    const systemPrompt = `You are playing the role of: ${scenario.aiRole || 'a conversation partner'}

SCENARIO: ${scenario.name}
CONTEXT: ${scenario.context || scenario.description}

INSTRUCTIONS:
- Stay in character throughout the conversation
- Respond naturally and conversationally (2-3 sentences typically)
- Ask follow-up questions when appropriate
- Be engaging but realistic for the scenario
- This is turn ${currentTurn} of ${maxTurns} total

${currentTurn >= maxTurns - 1 ? 'This is near the end of the conversation. Start wrapping up naturally.' : ''}
${currentTurn >= maxTurns ? 'This is the final turn. Conclude the conversation appropriately.' : ''}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.8,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Groq error:', error)
      throw new Error('AI response failed')
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || "I'm sorry, I didn't catch that. Could you repeat?"

    return NextResponse.json({ response: aiResponse })

  } catch (error) {
    console.error('Conversation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response', response: "I'm having trouble responding. Let's continue." },
      { status: 500 }
    )
  }
}