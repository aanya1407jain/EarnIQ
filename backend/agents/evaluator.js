import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL = 'gemini-1.5-flash'; // Fast and cheap for hackathon

function getModel() {
  return genAI.getGenerativeModel({ model: MODEL });
}

/**
 * Evaluate a student's answer using Gemini AI
 */
export async function evaluateAnswer({ question, correctAnswer, studentAnswer, difficulty, subject, type }) {
  // Mock mode if no API key
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return mockEvaluate(studentAnswer, correctAnswer);
  }

  const prompt = `You are a strict but fair AI tutor. Evaluate this student answer and respond ONLY with valid JSON.

Subject: ${subject}
Difficulty: ${difficulty}  
Type: ${type}
Question: ${question}
Expected Answer: ${correctAnswer}
Student Answer: ${studentAnswer}

Respond with this exact JSON structure (no markdown, no extra text):
{
  "isCorrect": boolean,
  "score": number (0-100),
  "partialCredit": boolean,
  "feedback": "encouraging 2-3 sentence feedback",
  "justification": "one sentence for payment audit trail",
  "hint": "helpful hint if wrong, empty string if correct",
  "concept": "key concept this tests",
  "strengths": ["what the student got right"],
  "improvements": ["what to study next"]
}

Rules:
- isCorrect = true only if score >= 75
- For MCQ: must match the correct option (case-insensitive)
- For coding: evaluate logic and approach, not just syntax
- For open: check for key concepts and understanding
- Be encouraging but accurate`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error('Gemini evaluation error:', e.message);
    // Fallback to mock if Gemini fails
    return mockEvaluate(studentAnswer, correctAnswer);
  }
}

/**
 * Generate a new question using Gemini
 */
export async function generateQuestion({ subject, difficulty, type, excludeIds = [] }) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return mockGenerate(subject, difficulty, type);
  }

  const typeInstructions = {
    mcq: `Generate a multiple choice question. Return:
{
  "question": "question text",
  "type": "mcq",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "correctAnswer": "A) the correct full option text",
  "explanation": "detailed explanation",
  "concept": "key concept"
}`,
    coding: `Generate a coding challenge. Return:
{
  "question": "challenge description with examples",
  "type": "coding",
  "starterCode": "function name(params) {\\n  // your code\\n}",
  "correctAnswer": "complete working solution with explanation of key steps",
  "explanation": "what a correct solution must do",
  "concept": "key concept"
}`,
    open: `Generate an open-ended conceptual question. Return:
{
  "question": "thought-provoking question",
  "type": "open",
  "correctAnswer": "key points that must appear in a correct answer",
  "explanation": "full explanation",
  "concept": "key concept"
}`,
  };

  const prompt = `You are a quiz generator for an AI tutoring platform. Generate ONE ${difficulty} ${type} question about: ${subject}

${typeInstructions[type] || typeInstructions.open}

Respond with ONLY the JSON object. No markdown. No extra text.`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error('Gemini generate error:', e.message);
    return mockGenerate(subject, difficulty, type);
  }
}

/**
 * Generate a personalized study hint for a topic
 */
export async function generateStudyTip({ subject, wrongConcept }) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return { tip: `Review the basics of ${wrongConcept} in ${subject}. Try practicing with small examples first.`, resources: [] };
  }

  const prompt = `A student just got a question wrong about "${wrongConcept}" in ${subject}.
Give a helpful 2-3 sentence study tip and 2-3 resource suggestions.
Respond ONLY with JSON:
{
  "tip": "personalized study advice",
  "resources": ["resource 1", "resource 2", "resource 3"]
}`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return { tip: `Focus on reviewing ${wrongConcept} fundamentals.`, resources: [] };
  }
}

// ── MOCK HELPERS (demo mode when no API key) ──────────────────────────────────
function mockEvaluate(studentAnswer, correctAnswer) {
  const answer = studentAnswer.toLowerCase().trim();
  const correct = correctAnswer.toLowerCase().trim();
  const isCorrect = answer.includes(correct.slice(0, 10)) || correct.includes(answer.slice(0, 10));
  return {
    isCorrect,
    score: isCorrect ? 85 : 35,
    partialCredit: false,
    feedback: isCorrect
      ? 'Great work! Your answer demonstrates solid understanding of the concept.'
      : 'Not quite right. Review the concept and try again — you\'re on the right track!',
    justification: isCorrect
      ? 'Student provided a correct answer demonstrating understanding of the topic.'
      : 'Answer did not meet the correctness threshold.',
    hint: isCorrect ? '' : `Think about: ${correctAnswer.slice(0, 60)}...`,
    concept: 'General concept',
    strengths: isCorrect ? ['Correct understanding', 'Clear response'] : ['Attempted the question'],
    improvements: isCorrect ? [] : ['Review core concepts', 'Practice more examples'],
    _mock: true,
  };
}

function mockGenerate(subject, difficulty, type) {
  if (type === 'mcq') {
    return {
      question: `[DEMO] What is a key feature of ${subject}?`,
      type: 'mcq',
      options: ['A) Feature Alpha', 'B) Feature Beta', 'C) Feature Gamma', 'D) Feature Delta'],
      correctAnswer: 'A) Feature Alpha',
      explanation: 'This is a demo question. Add your Gemini API key for real questions.',
      concept: subject,
      _mock: true,
    };
  }
  return {
    question: `[DEMO] Explain the main concept of ${subject} in your own words.`,
    type: 'open',
    correctAnswer: `Key aspects of ${subject} should be mentioned.`,
    explanation: 'Demo question — add Gemini API key for real AI-generated questions.',
    concept: subject,
    _mock: true,
  };
}
