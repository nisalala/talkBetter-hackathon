// src/app/api/conversation/respond/route.js

import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { scenario, messages, turnNumber, maxTurns } = await request.json()

    // Build conversation history for context
    const conversationHistory = messages.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.text,
    }))

    // Determine if this should be a closing question
    const isNearEnd = turnNumber >= maxTurns - 1
    const closingInstruction = isNearEnd 
      ? "This is near the end of the conversation. Start wrapping up naturally, perhaps with a closing question or statement."
      : ""

    const systemPrompt = `You are playing the role of: ${scenario.aiRole}

Context: ${scenario.context}

IMPORTANT RULES:
1. Stay in character at all times
2. Keep responses conversational and natural (2-4 sentences max)
3. Ask follow-up questions based on what the user actually said
4. React authentically to their responses (show interest, concern, skepticism as appropriate)
5. Don't be generic - reference specific things they mentioned
6. ${closingInstruction}

Current turn: ${turnNumber} of ${maxTurns}

Respond naturally as your character would, then ask a relevant follow-up question or make a statement that invites them to continue.`

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
          ...conversationHistory,
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Groq API error:', error)
      throw new Error('Failed to generate response')
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || "I see. Tell me more about that."

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('Conversation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}