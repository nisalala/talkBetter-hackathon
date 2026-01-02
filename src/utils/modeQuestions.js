export const modeQuestions = {
  pitch: {
    name: 'Pitch',
    icon: '🚀',
    questions: [
      {
        id: 'elevator',
        text: "Give a 60-second elevator pitch for your startup or idea.",
        duration: 60,
        tips: ['Start with the problem', 'Explain your solution', 'End with a clear ask'],
      },
      {
        id: 'investor',
        text: "You have 2 minutes with an investor. Pitch your product.",
        duration: 120,
        tips: ['Hook them in first 10 seconds', 'Show market opportunity', 'Mention traction if any'],
      },
      {
        id: 'product',
        text: "Explain your product to someone who's never heard of it.",
        duration: 90,
        tips: ['Avoid jargon', 'Use simple analogies', 'Focus on benefits not features'],
      },
      {
        id: 'value',
        text: "What makes your solution better than existing alternatives?",
        duration: 60,
        tips: ['Acknowledge competition', 'Be specific about differences', 'Use concrete examples'],
      },
    ],
  },

  interview: {
    name: 'Interview',
    icon: '💼',
    questions: [
      {
        id: 'about',
        text: "Tell me about yourself.",
        duration: 90,
        tips: ['Keep it professional', 'Highlight relevant experience', 'End with why you\'re here'],
      },
      {
        id: 'challenge',
        text: "Describe a challenge you faced and how you overcame it.",
        duration: 120,
        tips: ['Use STAR method', 'Be specific', 'Show what you learned'],
      },
      {
        id: 'weakness',
        text: "What is your greatest weakness?",
        duration: 60,
        tips: ['Be honest but strategic', 'Show self-awareness', 'Mention how you\'re improving'],
      },
      {
        id: 'why-hire',
        text: "Why should we hire you?",
        duration: 90,
        tips: ['Connect your skills to the role', 'Show enthusiasm', 'Be confident not arrogant'],
      },
      {
        id: 'five-years',
        text: "Where do you see yourself in 5 years?",
        duration: 60,
        tips: ['Show ambition', 'Align with company growth', 'Be realistic'],
      },
    ],
  },

  meeting: {
    name: 'Meeting',
    icon: '📊',
    questions: [
      {
        id: 'update',
        text: "Give a 60-second project status update to your team.",
        duration: 60,
        tips: ['Lead with key takeaway', 'Be concise', 'End with next steps'],
      },
      {
        id: 'proposal',
        text: "Propose a new idea or initiative to your manager.",
        duration: 120,
        tips: ['State the benefit upfront', 'Anticipate objections', 'Have a clear ask'],
      },
      {
        id: 'explain',
        text: "Explain a complex topic to a non-technical audience.",
        duration: 90,
        tips: ['Use analogies', 'Avoid jargon', 'Check for understanding'],
      },
    ],
  },

  date: {
    name: 'Date',
    icon: '💝',
    questions: [
      {
        id: 'intro',
        text: "Introduce yourself to someone you just met at a coffee shop.",
        duration: 60,
        tips: ['Be warm and genuine', 'Show curiosity about them', 'Keep it light'],
      },
      {
        id: 'hobbies',
        text: "What do you like to do for fun?",
        duration: 90,
        tips: ['Be specific', 'Show passion', 'Invite follow-up questions'],
      },
      {
        id: 'story',
        text: "Tell a funny or interesting story about yourself.",
        duration: 120,
        tips: ['Set the scene', 'Build suspense', 'Have a punchline or lesson'],
      },
      {
        id: 'values',
        text: "What's something you really care about?",
        duration: 90,
        tips: ['Be authentic', 'Show depth', 'Connect to your actions'],
      },
    ],
  },

  difficult: {
    name: 'Difficult Talk',
    icon: '🤝',
    questions: [
      {
        id: 'raise',
        text: "Ask your manager for a raise or promotion.",
        duration: 90,
        tips: ['State your case with evidence', 'Be confident not demanding', 'Have a specific ask'],
      },
      {
        id: 'feedback',
        text: "Give constructive feedback to a colleague.",
        duration: 90,
        tips: ['Lead with positive intent', 'Be specific about behavior', 'Offer solutions'],
      },
      {
        id: 'boundary',
        text: "Set a boundary with someone who keeps crossing it.",
        duration: 60,
        tips: ['Be clear and direct', 'Use "I" statements', 'State consequences calmly'],
      },
      {
        id: 'disagree',
        text: "Respectfully disagree with your boss's decision.",
        duration: 90,
        tips: ['Acknowledge their perspective', 'Present alternatives', 'Accept the final decision'],
      },
    ],
  },

  speech: {
    name: 'Speech',
    icon: '🎤',
    questions: [
      {
        id: 'inspire',
        text: "Give an inspiring 2-minute speech about pursuing your dreams.",
        duration: 120,
        tips: ['Start with a hook', 'Use personal stories', 'End with a call to action'],
      },
      {
        id: 'toast',
        text: "Give a toast at your best friend's wedding.",
        duration: 90,
        tips: ['Be heartfelt', 'Include a short story', 'Keep it appropriate'],
      },
      {
        id: 'ted',
        text: "Give a TED-style talk about something you're passionate about.",
        duration: 180,
        tips: ['One central idea', 'Tell stories', 'Make it memorable'],
      },
      {
        id: 'introduce',
        text: "Introduce yourself to an audience before your presentation.",
        duration: 60,
        tips: ['Establish credibility', 'Be personable', 'Preview what\'s coming'],
      },
    ],
  },

  general: {
    name: 'General',
    icon: '💬',
    questions: [
      {
        id: 'free',
        text: "Free practice - talk about anything for 1-2 minutes.",
        duration: 90,
        tips: ['Speak naturally', 'Practice clarity', 'Work on reducing filler words'],
      },
      {
        id: 'explain',
        text: "Explain your job to a 10-year-old.",
        duration: 60,
        tips: ['Use simple words', 'Use analogies', 'Make it fun'],
      },
      {
        id: 'story',
        text: "Tell a story about something interesting that happened to you.",
        duration: 120,
        tips: ['Set the scene', 'Build tension', 'Have a clear ending'],
      },
    ],
  },
}

export function getRandomQuestion(mode) {
  const modeData = modeQuestions[mode]
  if (!modeData) return null
  
  const questions = modeData.questions
  const randomIndex = Math.floor(Math.random() * questions.length)
  return questions[randomIndex]
}

export function getQuestionById(mode, questionId) {
  const modeData = modeQuestions[mode]
  if (!modeData) return null
  
  return modeData.questions.find(q => q.id === questionId)
}