// src/app/api/analyze/route.js

import { NextResponse } from 'next/server'

// Mode-specific configuration with 4 categories each
const modePrompts = {
  pitch: {
    name: 'Pitch',
    systemPrompt: 'You are an expert pitch coach who has helped thousands of entrepreneurs perfect their pitches.',
    focusAreas: [
      'Clarity - Is the problem and solution clearly articulated?',
      'Structure - Does it follow a logical flow (problem → solution → value → ask)?',
      'Persuasion - Is it compelling and memorable?',
      'Call-to-Action - Is there a clear next step?',
    ],
    metrics: ['clarity', 'structure', 'persuasion', 'callToAction'],
    relevanceCheck: 'pitching a product, idea, service, or themselves',
  },
  interview: {
    name: 'Interview',
    systemPrompt: 'You are a senior hiring manager and interview coach with experience at top companies.',
    focusAreas: [
      'Relevance - Does the answer address the likely question?',
      'Specificity - Are there concrete examples and details?',
      'Confidence - Does the speaker sound confident and competent?',
      'Hireability - Would this response help or hurt their chances?',
    ],
    metrics: ['relevance', 'specificity', 'confidence', 'hireability'],
    relevanceCheck: 'answering questions about experience, skills, qualifications, or professional background',
  },
  meeting: {
    name: 'Meeting',
    systemPrompt: 'You are a communication expert specializing in professional meeting effectiveness.',
    focusAreas: [
      'Conciseness - Is the point made efficiently without rambling?',
      'Value-Add - Does this contribution move the discussion forward?',
      'Action Items - Are there clear next steps or decisions?',
      'Clarity - Is the message easy to understand?',
    ],
    metrics: ['conciseness', 'valueAdd', 'actionItems', 'clarity'],
    relevanceCheck: 'discussing work topics, updates, ideas, or professional matters',
  },
  date: {
    name: 'Date',
    systemPrompt: 'You are a dating coach who helps people present their authentic selves.',
    focusAreas: [
      'Authenticity - Does the speaker sound genuine and real?',
      'Questions - Do they show interest by asking questions?',
      'Talk Ratio - Are they balancing talking and listening space?',
      'Engagement - Is this conversation interesting and engaging?',
    ],
    metrics: ['authenticity', 'questionsAsked', 'talkRatio', 'engagement'],
    relevanceCheck: 'having a personal conversation, sharing about themselves, or getting to know someone',
  },
  difficult: {
    name: 'Difficult Conversation',
    systemPrompt: 'You are a conflict resolution expert and communication therapist.',
    focusAreas: [
      'Empathy - Does the speaker acknowledge other perspectives?',
      'Assertiveness - Are needs and boundaries clearly expressed?',
      'Respectfulness - Is the tone appropriate and non-attacking?',
      'Resolution - Does this approach lead toward resolution?',
    ],
    metrics: ['empathy', 'assertiveness', 'respectfulness', 'resolution'],
    relevanceCheck: 'addressing a conflict, giving feedback, setting boundaries, or discussing sensitive topics',
  },
  speech: {
    name: 'Speech',
    systemPrompt: 'You are a public speaking coach who has trained TED speakers.',
    focusAreas: [
      'Engagement - Would the audience stay interested?',
      'Structure - Is there a clear beginning, middle, and end?',
      'Opening - Does the opening grab attention?',
      'Closing - Is there a memorable ending or call-to-action?',
    ],
    metrics: ['engagement', 'structure', 'opening', 'closing'],
    relevanceCheck: 'giving a speech, presentation, or public address',
  },
  general: {
    name: 'General',
    systemPrompt: 'You are a communication skills expert.',
    focusAreas: [
      'Clarity - Is the message clear and easy to follow?',
      'Confidence - Does the speaker sound self-assured?',
      'Pace - Is the speaking pace appropriate?',
      'Engagement - Is this interesting to listen to?',
    ],
    metrics: ['clarity', 'confidence', 'pace', 'engagement'],
    relevanceCheck: 'communicating thoughts, ideas, or information clearly',
  },
}

// Duration evaluation based on target
function evaluateDuration(actualDuration, targetDuration) {
  if (!targetDuration) {
    if (actualDuration < 10) {
      return { status: 'too_short', message: 'Your response was very brief. Try to elaborate more.', penalty: 15 }
    } else if (actualDuration > 300) {
      return { status: 'too_long', message: 'Your response was quite long. Try to be more concise.', penalty: 10 }
    }
    return { status: 'ok', message: 'Good length.', penalty: 0 }
  }

  const percentage = (actualDuration / targetDuration) * 100
  
  if (percentage < 50) {
    return { status: 'too_short', message: `You spoke for ${actualDuration}s but the target was ${targetDuration}s. You only used ${Math.round(percentage)}% of your time.`, penalty: 20 }
  } else if (percentage < 80) {
    return { status: 'slightly_short', message: `You spoke for ${actualDuration}s out of ${targetDuration}s (${Math.round(percentage)}%). A bit more content would help.`, penalty: 10 }
  } else if (percentage <= 120) {
    return { status: 'perfect', message: `Great timing! You used ${Math.round(percentage)}% of your target time (${actualDuration}s / ${targetDuration}s).`, penalty: 0 }
  } else if (percentage <= 150) {
    return { status: 'slightly_long', message: `You went a bit over time (${actualDuration}s vs ${targetDuration}s target).`, penalty: 5 }
  } else {
    return { status: 'too_long', message: `You significantly exceeded the time (${actualDuration}s vs ${targetDuration}s target).`, penalty: 15 }
  }
}

// WPM evaluation
function evaluateWPM(wpm) {
  if (wpm === 0) return { status: 'no_speech', rating: 'No Speech', message: 'No speech detected.', penalty: 50 }
  if (wpm < 80) return { status: 'too_slow', rating: 'Too Slow', message: `Your pace of ${wpm} WPM is quite slow. Aim for 120-150 WPM.`, penalty: 10 }
  if (wpm < 110) return { status: 'slow', rating: 'A Bit Slow', message: `Your pace of ${wpm} WPM is a bit slow.`, penalty: 5 }
  if (wpm <= 160) return { status: 'good', rating: 'Good Pace', message: `Your pace of ${wpm} WPM is excellent.`, penalty: 0 }
  if (wpm <= 180) return { status: 'fast', rating: 'A Bit Fast', message: `Your pace of ${wpm} WPM is a bit fast.`, penalty: 5 }
  return { status: 'too_fast', rating: 'Too Fast', message: `Your pace of ${wpm} WPM is too fast.`, penalty: 10 }
}

// Filler word analysis
function analyzeFillerWords(transcript) {
  const fillerPatterns = [
    { pattern: /\bum+\b/gi, word: 'um' },
    { pattern: /\buh+\b/gi, word: 'uh' },
    { pattern: /\blike\b/gi, word: 'like' },
    { pattern: /\byou know\b/gi, word: 'you know' },
    { pattern: /\bbasically\b/gi, word: 'basically' },
    { pattern: /\bactually\b/gi, word: 'actually' },
    { pattern: /\bliterally\b/gi, word: 'literally' },
    { pattern: /\bi mean\b/gi, word: 'I mean' },
    { pattern: /\bkind of\b/gi, word: 'kind of' },
    { pattern: /\bsort of\b/gi, word: 'sort of' },
  ]

  const counts = {}
  let total = 0

  fillerPatterns.forEach(({ pattern, word }) => {
    const matches = transcript.match(pattern) || []
    if (matches.length > 0) {
      counts[word] = matches.length
      total += matches.length
    }
  })

  return { counts, total }
}

export async function POST(request) {
  try {
    const { transcript, duration, mode, question, difficulty } = await request.json()

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({
        overallScore: 0,
        relevanceScore: 0,
        error: 'No speech detected',
        scores: {},
        strengths: [],
        improvements: ['Make sure your microphone is working and speak clearly.'],
        metrics: { wordCount: 0, wpm: 0, duration: duration || 0, fillerWords: { counts: {}, total: 0 } },
      })
    }

    const modeConfig = modePrompts[mode] || modePrompts.general
    
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length
    const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0
    const fillerAnalysis = analyzeFillerWords(transcript)
    
    const targetDuration = question?.duration || null
    const durationEval = evaluateDuration(duration, targetDuration)
    const wpmEval = evaluateWPM(wpm)

    const systemPrompt = `${modeConfig.systemPrompt}

You are analyzing a ${modeConfig.name.toLowerCase()} response.

CONTEXT:
- Mode: ${modeConfig.name}
- Prompt given to user: "${question?.text || 'Free practice - no specific prompt'}"
- Target Duration: ${targetDuration ? `${targetDuration} seconds` : 'No specific target'}
- Actual Duration: ${duration} seconds
- Word Count: ${wordCount} words
- Speaking Pace: ${wpm} WPM (${wpmEval.rating})
- Filler Words: ${fillerAnalysis.total} total ${fillerAnalysis.total > 0 ? `(${Object.entries(fillerAnalysis.counts).map(([w, c]) => `"${w}": ${c}`).join(', ')})` : ''}

EVALUATION CRITERIA for ${modeConfig.name}:
${modeConfig.focusAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

=== CRITICAL: RELEVANCE SCORING ===
First, evaluate how relevant the response is to the prompt. The user should be ${modeConfig.relevanceCheck}.

RELEVANCE SCORE GUIDE:
- 0-20: COMPLETELY OFF-TOPIC (e.g., singing a song, talking about unrelated things, gibberish)
- 21-50: PARTIALLY RELEVANT (mentions the topic but doesn't answer properly)
- 51-75: MOSTLY RELEVANT (answers the prompt but misses key aspects)
- 76-100: FULLY RELEVANT (directly addresses the prompt)

If relevanceScore is 20 or below, the response is INVALID and should not receive meaningful scores.
=======================================

TIMING: ${durationEval.message}
PACE: ${wpmEval.message}

DIFFICULTY LEVEL: ${difficulty || 'balanced'}
${difficulty === 'gentle' ? 'Be encouraging and supportive in your feedback.' : ''}
${difficulty === 'tough' ? 'Be demanding and direct. Hold them to high standards.' : ''}

TRANSCRIPT TO ANALYZE:
"${transcript}"

Return ONLY valid JSON with this exact structure:
{
  "relevanceScore": <0-100, how relevant is the response to the prompt>,
  "relevanceIssue": <null if relevance > 50, otherwise string explaining what was off-topic>,
  "overallScore": <0-100, overall quality score>,
  "scores": {
    "${modeConfig.metrics[0]}": <0-100>,
    "${modeConfig.metrics[1]}": <0-100>,
    "${modeConfig.metrics[2]}": <0-100>,
    "${modeConfig.metrics[3]}": <0-100>
  },
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvements": ["<specific actionable improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "timingFeedback": "<feedback on timing based on target duration>",
  "paceFeedback": "<feedback on speaking pace>",
  "rewrittenExample": "<brief example of how to improve one key point from their response>"
}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a communication coach. Respond only with valid JSON. No markdown, no explanation, just the JSON object.' },
          { role: 'user', content: systemPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Groq API error:', errorData)
      throw new Error('AI analysis failed')
    }

    const data = await response.json()
    let analysis

    try {
      const content = data.choices[0]?.message?.content || '{}'
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      analysis = {
        overallScore: 50,
        relevanceScore: 50,
        scores: { 
          [modeConfig.metrics[0]]: 50, 
          [modeConfig.metrics[1]]: 50, 
          [modeConfig.metrics[2]]: 50, 
          [modeConfig.metrics[3]]: 50 
        },
        strengths: ['Completed the recording'],
        improvements: ['Try again for detailed feedback'],
      }
    }

    // Ensure relevanceScore exists
    const relevanceScore = analysis.relevanceScore ?? 70

    // ============================================
    // 🎯 CONTEXT-AWARE SCORING LOGIC
    // ============================================
    let finalScore = analysis.overallScore || 70
    let finalScores = { ...analysis.scores }
    let isOffTopic = false

    // If relevance is 20 or below, ZERO OUT everything
    if (relevanceScore <= 20) {
      isOffTopic = true
      finalScore = 0
      // Zero out all category scores
      Object.keys(finalScores).forEach(key => {
        finalScores[key] = 0
      })
    } 
    // If relevance is 21-50, significantly penalize
    else if (relevanceScore <= 50) {
      finalScore = Math.min(finalScore, 40)
      // Cap all category scores at 50
      Object.keys(finalScores).forEach(key => {
        finalScores[key] = Math.min(finalScores[key] || 0, 50)
      })
    }
    // Normal scoring for relevance > 50
    else {
      // Apply duration penalty
      finalScore = Math.max(0, finalScore - durationEval.penalty)
      
      // Apply WPM penalty
      finalScore = Math.max(0, finalScore - wpmEval.penalty)
      
      // Apply filler word penalty (only if more than 3)
      if (fillerAnalysis.total > 3) {
        const fillerPenalty = Math.floor((fillerAnalysis.total - 3) / 2)
        finalScore = Math.max(0, finalScore - fillerPenalty)
      }
    }

    // Build final analysis response
    const finalAnalysis = {
      relevanceScore,
      relevanceIssue: analysis.relevanceIssue || null,
      isOffTopic,
      overallScore: Math.round(finalScore),
      scores: finalScores,
      strengths: isOffTopic 
        ? ['You completed the recording'] 
        : (analysis.strengths || []),
      improvements: isOffTopic 
        ? [
            'Your response was off-topic. Make sure to address the prompt directly.',
            'Listen to or read the question carefully before responding.',
            'Stay focused on the topic throughout your response.'
          ] 
        : (analysis.improvements || []),
      timingFeedback: analysis.timingFeedback || durationEval.message,
      paceFeedback: analysis.paceFeedback || wpmEval.message,
      rewrittenExample: isOffTopic ? null : analysis.rewrittenExample,
      metrics: {
        wordCount,
        wpm,
        wpmRating: wpmEval,
        duration,
        targetDuration,
        durationEvaluation: durationEval,
        fillerWords: fillerAnalysis,
      },
    }

    // Add relevance issue to improvements if partially off-topic
    if (analysis.relevanceIssue && !isOffTopic) {
      finalAnalysis.improvements = [
        `⚠️ Relevance issue: ${analysis.relevanceIssue}`, 
        ...(finalAnalysis.improvements || []).slice(0, 2)
      ]
    }

    return NextResponse.json(finalAnalysis)

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze speech', 
      overallScore: 0, 
      relevanceScore: 0,
      scores: {}, 
      strengths: [], 
      improvements: ['Please try again.'] 
    }, { status: 500 })
  }
}