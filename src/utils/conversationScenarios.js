// src/utils/conversationScenarios.js

export const conversationScenarios = {
  interview: {
    id: 'interview',
    name: 'Job Interview',
    icon: '💼',
    description: 'Practice with a realistic job interviewer',
    scenarios: [
      {
        id: 'tech-interview',
        name: 'Tech Company Interview',
        description: 'Interview for a software/tech role',
        aiRole: 'Senior Technical Recruiter at a top tech company',
        context: 'The candidate is interviewing for a mid-level position. Be professional but friendly. Ask follow-up questions based on their responses.',
        openingLine: "Thanks for coming in today. I've reviewed your resume and I'm excited to learn more about you. Let's start simple - can you tell me a bit about yourself and what drew you to this role?",
      },
      {
        id: 'behavioral',
        name: 'Behavioral Interview',
        description: 'STAR method practice',
        aiRole: 'HR Manager conducting a behavioral interview',
        context: 'Focus on behavioral questions. Ask for specific examples. Probe deeper when answers are vague.',
        openingLine: "Welcome! Today I'd like to understand how you handle various workplace situations. Let's start - tell me about a time when you faced a significant challenge at work. What happened?",
      },
      {
        id: 'startup',
        name: 'Startup Interview',
        description: 'Fast-paced startup culture fit',
        aiRole: 'Startup founder looking for early employees',
        context: 'Be casual but evaluative. Care about passion, adaptability, and culture fit. Ask unconventional questions.',
        openingLine: "Hey! Thanks for chatting with us. We move fast here and wear many hats. I'm curious - what's something you've built or created that you're really proud of, even if it's outside of work?",
      },
    ],
  },
  date: {
    id: 'date',
    name: 'First Date',
    icon: '💝',
    description: 'Practice conversation skills for dating',
    scenarios: [
      {
        id: 'coffee-date',
        name: 'Coffee Date',
        description: 'Casual first meeting',
        aiRole: 'A friendly person on a first date who is genuinely interested in getting to know you',
        context: 'Be warm and engaged. Ask follow-up questions. Show genuine curiosity. React naturally to what they say.',
        openingLine: "Hey! It's so nice to finally meet you in person. This place is cozy, right? So, what's been the highlight of your week so far?",
      },
      {
        id: 'dinner-date',
        name: 'Dinner Date',
        description: 'More formal first date',
        aiRole: 'Someone on a dinner date who values good conversation',
        context: 'Be engaging and thoughtful. Balance talking and asking questions. Look for shared interests.',
        openingLine: "I'm glad we could do this. I've heard great things about this restaurant. So tell me, what do you like to do when you're not working?",
      },
    ],
  },
  difficult: {
    id: 'difficult',
    name: 'Difficult Conversations',
    icon: '🤝',
    description: 'Practice handling tough workplace talks',
    scenarios: [
      {
        id: 'salary-negotiation',
        name: 'Salary Negotiation',
        description: 'Negotiate a raise or starting salary',
        aiRole: 'A hiring manager or boss who has budget constraints but values good employees',
        context: 'Be realistic about constraints. Push back on requests but remain open. Test their negotiation skills.',
        openingLine: "Thanks for setting up this meeting. I understand you wanted to discuss your compensation. What's on your mind?",
      },
      {
        id: 'conflict-resolution',
        name: 'Conflict with Colleague',
        description: 'Resolve a workplace disagreement',
        aiRole: 'A colleague who feels frustrated about a recent project issue',
        context: 'Start slightly defensive but be open to resolution. React based on how empathetically they communicate.',
        openingLine: "Look, I think we need to talk about what happened in the last project. I felt like my ideas weren't being heard. What's your take on this?",
      },
      {
        id: 'giving-feedback',
        name: 'Giving Tough Feedback',
        description: 'Practice delivering constructive criticism',
        aiRole: 'An employee who is underperforming but is sensitive to criticism',
        context: 'React realistically to feedback. Get defensive if feedback is harsh, open up if it is empathetic.',
        openingLine: "Hey, you wanted to chat? What's up?",
      },
    ],
  },
  pitch: {
    id: 'pitch',
    name: 'Pitch Practice',
    icon: '🚀',
    description: 'Pitch to investors or clients',
    scenarios: [
      {
        id: 'investor-pitch',
        name: 'Investor Pitch',
        description: 'Pitch your startup to a VC',
        aiRole: 'A skeptical but fair venture capitalist who has seen hundreds of pitches',
        context: 'Ask tough questions about market size, competition, traction. Be skeptical but give them a chance.',
        openingLine: "Alright, you've got my attention for the next few minutes. What are you building and why should I care?",
      },
      {
        id: 'client-pitch',
        name: 'Client Sales Pitch',
        description: 'Sell your product/service to a client',
        aiRole: 'A potential client who has budget but is considering competitors',
        context: 'Ask about pricing, competitors, implementation. Express concerns. Make them work for the sale.',
        openingLine: "Thanks for coming in. We're evaluating a few options right now. Tell me why we should go with you.",
      },
    ],
  },
  networking: {
    id: 'networking',
    name: 'Networking',
    icon: '🤝',
    description: 'Practice professional networking',
    scenarios: [
      {
        id: 'conference',
        name: 'Conference Networking',
        description: 'Meet someone at a professional event',
        aiRole: 'A senior professional at a conference who is open to meeting new people',
        context: 'Be friendly but busy. Engage if they are interesting. Exchange info if connection seems valuable.',
        openingLine: "Hi there! Quite an event, isn't it? I don't think we've met - what brings you here today?",
      },
    ],
  },
}

export const getScenario = (modeId, scenarioId) => {
  const mode = conversationScenarios[modeId]
  if (!mode) return null
  return mode.scenarios.find(s => s.id === scenarioId) || mode.scenarios[0]
}

export const getAllModes = () => {
  return Object.values(conversationScenarios).map(mode => ({
    id: mode.id,
    name: mode.name,
    icon: mode.icon,
    description: mode.description,
    scenarioCount: mode.scenarios.length,
  }))
}