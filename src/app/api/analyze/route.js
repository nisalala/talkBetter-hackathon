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

// ============================================
// 🆕 GRAMMAR ANALYSIS (Pre-check common issues)
// ============================================
function analyzeBasicGrammar(transcript) {
  const issues = []
  
  // Common grammar patterns to check
  // ❌ REMOVED: Capitalization - this is a transcription artifact, not a speech error
  const patterns = [
    {
      pattern: /\b(he|she|it)\s+(have|are)\b/gi,
      issue: 'Subject-verb agreement',
      type: 'agreement',
    },
    {
      pattern: /\b(they|we|you)\s+(has|is)\b/gi,
      issue: 'Subject-verb agreement',
      type: 'agreement',
    },
    {
      pattern: /\b(could|would|should|must)\s+of\b/gi,
      issue: '"Could of" should be "could have"',
      type: 'word_choice',
    },
    {
      pattern: /\bdoesn't\s+\w+s\b/gi,
      issue: 'Double negative verb form',
      type: 'verb_form',
    },
    {
      pattern: /\bmore\s+\w+er\b/gi,
      issue: 'Double comparative (more + -er)',
      type: 'comparative',
    },
    {
      pattern: /\bmost\s+\w+est\b/gi,
      issue: 'Double superlative (most + -est)',
      type: 'superlative',
    },
    // Additional speech-relevant patterns
    {
      pattern: /\b(me|him|her|them)\s+(and\s+)?(me|I)\b/gi,
      issue: 'Pronoun case error',
      type: 'pronoun',
    },
    {
      pattern: /\bain't\b/gi,
      issue: 'Non-standard contraction',
      type: 'word_choice',
    },
    {
      pattern: /\b(don't|doesn't)\s+got\b/gi,
      issue: '"Don\'t got" should be "don\'t have"',
      type: 'word_choice',
    },
    {
      pattern: /\bsuppose\s+to\b/gi,
      issue: '"Suppose to" should be "supposed to"',
      type: 'word_choice',
    },
    {
      pattern: /\buse\s+to\b/gi,
      issue: '"Use to" should be "used to"',
      type: 'word_choice',
    },
  ]

  let potentialIssueCount = 0
  
  patterns.forEach(({ pattern, issue, type }) => {
    const matches = transcript.match(pattern)
    if (matches) {
      potentialIssueCount += matches.length
      issues.push({
        type,
        issue,
        examples: matches.slice(0, 3),
        count: matches.length,
      })
    }
  })

  return {
    potentialIssues: issues,
    issueCount: potentialIssueCount,
  }
}

// ============================================
// 🆕 PRONUNCIATION INFERENCE
// ============================================
function analyzePronunciationIndicators(transcript) {
  // These patterns might indicate pronunciation issues when transcribed
  const indicators = {
    // Words that are often mispronounced
    commonMispronunciations: [
      { word: 'expresso', correct: 'espresso' },
      { word: 'supposably', correct: 'supposedly' },
      { word: 'probly', correct: 'probably' },
      { word: 'prolly', correct: 'probably' },
      { word: 'definately', correct: 'definitely' },
      { word: 'nucular', correct: 'nuclear' },
      { word: 'excape', correct: 'escape' },
      { word: 'excetera', correct: 'et cetera' },
      { word: 'aks', correct: 'ask' },
      { word: 'libary', correct: 'library' },
      { word: 'febuary', correct: 'February' },
      { word: 'artic', correct: 'arctic' },
      { word: 'jewlery', correct: 'jewelry' },
      { word: 'pronounciation', correct: 'pronunciation' },
      { word: 'mischievious', correct: 'mischievous' },
    ],
    // Merged/slurred words (informal speech)
    slurredPatterns: [
      { pattern: /\bgonna\b/gi, formal: 'going to' },
      { pattern: /\bwanna\b/gi, formal: 'want to' },
      { pattern: /\bgotta\b/gi, formal: 'got to' },
      { pattern: /\bkinda\b/gi, formal: 'kind of' },
      { pattern: /\bsorta\b/gi, formal: 'sort of' },
      { pattern: /\blemme\b/gi, formal: 'let me' },
      { pattern: /\bgivme\b/gi, formal: 'give me' },
      { pattern: /\bdunno\b/gi, formal: 'don\'t know' },
      { pattern: /\bcause\b/gi, formal: 'because' },
      { pattern: /\bcuz\b/gi, formal: 'because' },
    ],
  }

  const found = {
    mispronunciations: [],
    informalSpeech: [],
  }

  // Check for mispronunciations
  indicators.commonMispronunciations.forEach(({ word, correct }) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = transcript.match(regex)
    if (matches) {
      found.mispronunciations.push({
        said: word,
        shouldBe: correct,
        count: matches.length,
      })
    }
  })

  // Check for slurred/informal speech
  indicators.slurredPatterns.forEach(({ pattern, formal }) => {
    const matches = transcript.match(pattern)
    if (matches) {
      found.informalSpeech.push({
        said: matches[0],
        formal,
        count: matches.length,
      })
    }
  })

  // Calculate a basic clarity score based on issues found
  const totalIssues = found.mispronunciations.length + found.informalSpeech.length
  const wordCount = transcript.split(/\s+/).length
  const issueRatio = totalIssues / Math.max(wordCount, 1)
  
  // Estimate pronunciation score (this is approximate since we're working with text)
  let estimatedScore = 100
  estimatedScore -= found.mispronunciations.length * 5
  estimatedScore -= found.informalSpeech.length * 2
  estimatedScore = Math.max(0, Math.min(100, estimatedScore))

  return {
    mispronunciations: found.mispronunciations,
    informalSpeech: found.informalSpeech,
    estimatedScore,
    issueCount: totalIssues,
  }
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
        grammar: { score: 0, issues: [] },
        pronunciation: { score: 0, issues: [] },
      })
    }

    const modeConfig = modePrompts[mode] || modePrompts.general
    
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length
    const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0
    const fillerAnalysis = analyzeFillerWords(transcript)
    const basicGrammar = analyzeBasicGrammar(transcript)
    const pronunciationIndicators = analyzePronunciationIndicators(transcript)
    
    const targetDuration = question?.duration || null
    const durationEval = evaluateDuration(duration, targetDuration)
    const wpmEval = evaluateWPM(wpm)

    // ============================================
    // 🆕 ENHANCED PROMPT WITH GRAMMAR & PRONUNCIATION
    // ============================================
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

=== GRAMMAR ANALYSIS ===
Analyze the transcript for SPOKEN grammar issues including:
- Subject-verb agreement (e.g., "he have" → "he has")
- Tense consistency (switching between past and present incorrectly)
- Sentence structure (incomplete thoughts, run-on sentences when spoken)
- Word choice errors (e.g., "could of" → "could have", "supposably" → "supposedly")
- Pronoun errors (e.g., "me and him went" → "he and I went")

DO NOT FLAG:
- Capitalization (handled by transcription AI)
- Punctuation (not relevant to speech)
- Contractions (normal in speech)

Provide a grammar score (0-100) and list specific spoken grammar issues found.
========================

=== PRONUNCIATION & CLARITY ===
Based on the transcript, infer pronunciation and clarity:
- Are words clear and properly formed?
- Any apparent mispronunciations that affected transcription?
- Speaking clarity overall

Note: Since this is transcribed text, focus on indicators of unclear speech.
================================

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
  "grammar": {
    "score": <0-100, grammar quality>,
    "issues": [
      {
        "type": "<error type: agreement|tense|structure|word_choice|article|pronoun|other>",
        "original": "<the problematic phrase>",
        "suggestion": "<corrected version>",
        "explanation": "<brief explanation>"
      }
    ],
    "feedback": "<overall grammar feedback>"
  },
  "pronunciation": {
    "score": <0-100, estimated clarity/pronunciation>,
    "clarity": "<clear|mostly_clear|unclear>",
    "issues": [
      {
        "word": "<word with potential issue>",
        "suggestion": "<how it should sound/be pronounced>",
        "type": "<mispronunciation|slurred|unclear>"
      }
    ],
    "feedback": "<overall pronunciation/clarity feedback>"
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
        max_tokens: 2000, // Increased for grammar/pronunciation
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
        grammar: { score: 70, issues: [], feedback: 'Unable to analyze grammar.' },
        pronunciation: { score: 70, issues: [], clarity: 'mostly_clear', feedback: 'Unable to analyze pronunciation.' },
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
      Object.keys(finalScores).forEach(key => {
        finalScores[key] = 0
      })
    } 
    // If relevance is 21-50, significantly penalize
    else if (relevanceScore <= 50) {
      finalScore = Math.min(finalScore, 40)
      Object.keys(finalScores).forEach(key => {
        finalScores[key] = Math.min(finalScores[key] || 0, 50)
      })
    }
    // Normal scoring for relevance > 50
    else {
      finalScore = Math.max(0, finalScore - durationEval.penalty)
      finalScore = Math.max(0, finalScore - wpmEval.penalty)
      
      if (fillerAnalysis.total > 3) {
        const fillerPenalty = Math.floor((fillerAnalysis.total - 3) / 2)
        finalScore = Math.max(0, finalScore - fillerPenalty)
      }
    }

    // ============================================
    // 🆕 MERGE LOCAL ANALYSIS WITH AI ANALYSIS
    // ============================================
    
    // Merge grammar data
    const grammarData = {
      score: analysis.grammar?.score || 80,
      issues: [
        ...(analysis.grammar?.issues || []),
        ...basicGrammar.potentialIssues.map(issue => ({
          type: issue.type,
          original: issue.examples?.[0] || '',
          suggestion: '',
          explanation: issue.issue,
        })),
      ].slice(0, 10), // Limit to 10 issues
      feedback: analysis.grammar?.feedback || 'Grammar analysis complete.',
      issueCount: (analysis.grammar?.issues?.length || 0) + basicGrammar.issueCount,
    }

    // Merge pronunciation data
    const pronunciationData = {
      score: analysis.pronunciation?.score || pronunciationIndicators.estimatedScore,
      clarity: analysis.pronunciation?.clarity || 'mostly_clear',
      issues: [
        ...(analysis.pronunciation?.issues || []),
        ...pronunciationIndicators.mispronunciations.map(m => ({
          word: m.said,
          suggestion: m.shouldBe,
          type: 'mispronunciation',
        })),
        ...pronunciationIndicators.informalSpeech.map(s => ({
          word: s.said,
          suggestion: s.formal,
          type: 'informal',
        })),
      ].slice(0, 10), // Limit to 10 issues
      feedback: analysis.pronunciation?.feedback || 'Pronunciation analysis complete.',
      informalSpeech: pronunciationIndicators.informalSpeech,
    }

    // Apply grammar penalty to final score
    if (grammarData.score < 70) {
      finalScore = Math.max(0, finalScore - Math.round((70 - grammarData.score) / 5))
    }

    // Build final analysis response
    const finalAnalysis = {
      relevanceScore,
      relevanceIssue: analysis.relevanceIssue || null,
      isOffTopic,
      overallScore: Math.round(finalScore),
      scores: finalScores,
      
      // 🆕 Grammar & Pronunciation
      grammar: grammarData,
      pronunciation: pronunciationData,
      
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
      grammar: { score: 0, issues: [], feedback: 'Analysis failed.' },
      pronunciation: { score: 0, issues: [], feedback: 'Analysis failed.' },
      strengths: [], 
      improvements: ['Please try again.'] 
    }, { status: 500 })
  }
}