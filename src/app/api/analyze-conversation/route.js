// src/app/api/analyze-conversation/route.js

import { NextResponse } from 'next/server'

// ============================================
// 🆕 GRAMMAR ANALYSIS HELPER
// ============================================
function analyzeBasicGrammar(transcript) {
  const issues = []
  
  const patterns = [
    {
      pattern: /\bi\s+(?!am|was|have|had|will|would|could|should|might|can|do|did|'m|'ve|'ll|'d)/gi,
      issue: 'Lowercase "I"',
      type: 'capitalization',
    },
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
// 🆕 PRONUNCIATION INFERENCE HELPER
// ============================================
function analyzePronunciationIndicators(transcript) {
  const indicators = {
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
    slurredPatterns: [
      { pattern: /\bgonna\b/gi, formal: 'going to' },
      { pattern: /\bwanna\b/gi, formal: 'want to' },
      { pattern: /\bgotta\b/gi, formal: 'got to' },
      { pattern: /\bkinda\b/gi, formal: 'kind of' },
      { pattern: /\bsorta\b/gi, formal: 'sort of' },
      { pattern: /\blemme\b/gi, formal: 'let me' },
      { pattern: /\bgivme\b/gi, formal: 'give me' },
      { pattern: /\bdunno\b/gi, formal: "don't know" },
      { pattern: /\bcause\b/gi, formal: 'because' },
      { pattern: /\bcuz\b/gi, formal: 'because' },
    ],
  }

  const found = {
    mispronunciations: [],
    informalSpeech: [],
  }

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

  const totalIssues = found.mispronunciations.length + found.informalSpeech.length
  
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

// ============================================
// FILLER WORD ANALYSIS
// ============================================
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
    { pattern: /\bhonestly\b/gi, word: 'honestly' },
    { pattern: /\bright\b/gi, word: 'right' },
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
    const { messages, scenario, duration } = await request.json()

    // Separate user and AI messages
    const userMessages = messages.filter(m => m.role === 'user')
    const aiMessages = messages.filter(m => m.role === 'ai')

    // Calculate basic metrics
    const userText = userMessages.map(m => m.text).join(' ')
    const wordCount = userText.split(/\s+/).filter(w => w.length > 0).length
    const avgWordsPerResponse = userMessages.length > 0 
      ? Math.round(wordCount / userMessages.length) 
      : 0
    
    // Analyze filler words
    const fillerAnalysis = analyzeFillerWords(userText)
    
    // 🆕 Analyze grammar
    const basicGrammar = analyzeBasicGrammar(userText)
    
    // 🆕 Analyze pronunciation indicators
    const pronunciationIndicators = analyzePronunciationIndicators(userText)

    // Format conversation for analysis
    const conversationText = messages.map(m => 
      `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.text}`
    ).join('\n\n')

    // ============================================
    // 🆕 ENHANCED PROMPT WITH GRAMMAR & PRONUNCIATION
    // ============================================
    const systemPrompt = `You are an expert communication coach analyzing a practice conversation.

SCENARIO: ${scenario.name}
AI ROLE: ${scenario.aiRole}

CONVERSATION:
${conversationText}

=== ANALYSIS TASKS ===

1. OVERALL PERFORMANCE: Rate the conversation quality (0-100)

2. CATEGORY SCORES (0-100 each):
   - relevance: How well did they stay on topic?
   - clarity: How clear was their communication?
   - engagement: How engaged were they in the conversation?
   - adaptability: How well did they adapt to the conversation flow?
   - confidence: How confident did they sound?

3. GRAMMAR ANALYSIS:
   - Score their grammar (0-100)
   - Identify specific grammar issues with corrections
   - Types: agreement, tense, structure, word_choice, article, pronoun

4. PRONUNCIATION/CLARITY:
   - Estimate clarity score (0-100) based on how clear their speech appears
   - Note any words that seem unclear or mispronounced
   - Rate overall clarity: "clear", "mostly_clear", or "unclear"

5. STRENGTHS: List 3-4 specific things they did well with examples

6. IMPROVEMENTS: List 3-4 specific areas to improve with actionable advice

7. CONVERSATION FLOW: Rate (0-100) and provide feedback on flow

8. QUESTION HANDLING: Rate (0-100) and provide feedback on how they answered questions

9. KEY MOMENTS: Quote 2-3 specific things they said with feedback

Return your analysis as JSON with this exact structure:
{
  "overallScore": <number 0-100>,
  "relevanceScore": <number 0-100, how relevant responses were to the scenario>,
  "relevanceIssue": <null if relevant, otherwise explain what was off-topic>,
  "scores": {
    "relevance": <number 0-100>,
    "clarity": <number 0-100>,
    "engagement": <number 0-100>,
    "adaptability": <number 0-100>,
    "confidence": <number 0-100>
  },
  "grammar": {
    "score": <0-100>,
    "issues": [
      {
        "type": "<agreement|tense|structure|word_choice|article|pronoun|other>",
        "original": "<the problematic phrase>",
        "suggestion": "<corrected version>",
        "explanation": "<brief explanation>"
      }
    ],
    "feedback": "<overall grammar feedback>"
  },
  "pronunciation": {
    "score": <0-100>,
    "clarity": "<clear|mostly_clear|unclear>",
    "issues": [
      {
        "word": "<word with issue>",
        "suggestion": "<how it should be>",
        "type": "<mispronunciation|slurred|unclear>"
      }
    ],
    "feedback": "<overall clarity feedback>"
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
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analyze this conversation and return the JSON analysis.' },
        ],
        temperature: 0.7,
        max_tokens: 2500, // Increased for grammar/pronunciation
      }),
    })

    if (!response.ok) {
      throw new Error('Analysis failed')
    }

    const data = await response.json()
    let analysis
    
    try {
      const content = data.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch (e) {
      console.error('Failed to parse analysis:', e)
      analysis = {
        overallScore: 70,
        relevanceScore: 70,
        scores: { relevance: 70, clarity: 70, engagement: 70, adaptability: 70, confidence: 70 },
        grammar: { score: 70, issues: [], feedback: 'Unable to analyze grammar.' },
        pronunciation: { score: 70, issues: [], clarity: 'mostly_clear', feedback: 'Unable to analyze clarity.' },
        strengths: ['Completed the conversation'],
        improvements: ['Continue practicing for more detailed feedback'],
        overallFeedback: 'Good effort! Keep practicing to improve.',
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
      ].slice(0, 10),
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
      ].slice(0, 10),
      feedback: analysis.pronunciation?.feedback || 'Clarity analysis complete.',
      informalSpeech: pronunciationIndicators.informalSpeech,
    }

    // Build final response
    const finalAnalysis = {
      ...analysis,
      
      // Ensure these exist
      relevanceScore: analysis.relevanceScore ?? 80,
      relevanceIssue: analysis.relevanceIssue || null,
      
      // 🆕 Grammar & Pronunciation
      grammar: grammarData,
      pronunciation: pronunciationData,
      
      // Metrics
      metrics: {
        totalMessages: messages.length,
        userResponses: userMessages.length,
        wordCount,
        avgWordsPerResponse,
        fillerWords: fillerAnalysis.total,
        fillerWordDetails: fillerAnalysis.counts,
        duration,
      },
    }

    return NextResponse.json(finalAnalysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze conversation',
        overallScore: 0,
        grammar: { score: 0, issues: [], feedback: 'Analysis failed.' },
        pronunciation: { score: 0, issues: [], feedback: 'Analysis failed.' },
      },
      { status: 500 }
    )
  }
}