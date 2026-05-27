import axios from 'axios';
import logger from '../config/logger';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

export interface QuestionTypeConfig {
  type: string;
  quantity: number;
  marks: number;
}

export interface GeneratedQuestion {
  text: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  answer?: string;
}

export interface GeneratedSection {
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedAssignment {
  sections: GeneratedSection[];
}

const buildPrompt = (
  title: string,
  subject: string,
  cls: string,
  questionTypes: QuestionTypeConfig[],
  additionalInfo?: string,
  uploadedText?: string
): string => {
  const typeSummary = questionTypes
    .map((qt) => `- ${qt.quantity} ${qt.type} questions (${qt.marks} marks each)`)
    .join('\n');

  const contextSection = uploadedText
    ? `\n\nREFERENCE MATERIAL (use this as source for questions):\n${uploadedText.substring(0, 3000)}`
    : '';

  const additionalSection = additionalInfo
    ? `\n\nADDITIONAL INSTRUCTIONS: ${additionalInfo}`
    : '';

  return `You are an expert teacher creating a professional examination paper. Generate questions STRICTLY following the structure below.

ASSIGNMENT DETAILS:
- Title: ${title}
- Subject: ${subject}
- Class: ${cls}
- Question Requirements:
${typeSummary}${contextSection}${additionalSection}

INSTRUCTIONS:
1. Group questions by type into sections (Section A, Section B, etc.)
2. Assign difficulty: 35% easy, 40% medium, 25% hard
3. For MCQ: provide the question only (no options needed)
4. Include a model answer for each question
5. Make questions appropriate for ${cls} grade level
6. Questions must be UNIQUE and THOUGHTFUL

RETURN ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION. NO EXTRA TEXT.

Required JSON format:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Answer all questions. Each question carries the marks mentioned.",
      "questions": [
        {
          "text": "Question text here",
          "marks": 2,
          "difficulty": "easy",
          "answer": "Model answer here"
        }
      ]
    }
  ]
}

Now generate the examination paper JSON:`;
};

const sanitizeJSON = (raw: string): GeneratedAssignment => {
  // Remove markdown code blocks if present
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

  // Find the first { and last } to extract JSON
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No valid JSON object found in response');
  }
  cleaned = cleaned.substring(start, end + 1);

  const parsed = JSON.parse(cleaned);

  // Validate structure
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid response structure: missing sections array');
  }

  // Sanitize each section and question
  parsed.sections = parsed.sections.map((section: any, i: number) => ({
    title: section.title || `Section ${String.fromCharCode(65 + i)}`,
    instruction: section.instruction || 'Answer all questions.',
    questions: (section.questions || []).map((q: any, j: number) => ({
      text: q.text || q.question || `Question ${j + 1}`,
      marks: typeof q.marks === 'number' ? q.marks : 1,
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      answer: q.answer || q.model_answer || undefined,
    })),
  }));

  return parsed as GeneratedAssignment;
};

export const generateAssignment = async (
  title: string,
  subject: string,
  cls: string,
  questionTypes: QuestionTypeConfig[],
  additionalInfo?: string,
  uploadedText?: string,
  maxRetries = 3
): Promise<GeneratedAssignment> => {
  const prompt = buildPrompt(title, subject, cls, questionTypes, additionalInfo, uploadedText);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`AI generation attempt ${attempt}/${maxRetries}`);

      const response = await axios.post(
        OLLAMA_URL,
        {
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: { temperature: 0.7, top_p: 0.9 },
        },
        { timeout: 120000 }
      );

      const rawText = response.data?.response as string | undefined;
      if (!rawText) throw new Error('Empty response from Ollama');

      logger.debug('Raw AI response received, sanitizing...');
      const result = sanitizeJSON(rawText);
      logger.info(`Successfully generated ${result.sections.length} sections`);
      return result;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`AI generation attempt ${attempt} failed: ${errMsg}`);
      if (attempt === maxRetries) throw error;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  throw new Error('All AI generation attempts failed');
};
