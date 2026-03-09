const StudyMaterial = require("../models/StudyMaterial");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const CACHE_HOURS = 24; // Reuse cached content for 24 hours before regenerating

// ── Groq API call ──────────────────────────────────────────────────────────
async function callGroqAPI(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error("GROQ_API_KEY is not configured in .env");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert university academic tutor. Always respond with valid JSON only — no markdown fences, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3500,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// ── Prompt builder ──────────────────────────────────────────────────────────
function buildPrompt(subjectName, marks, grade) {
  const perf =
    marks != null
      ? `The student scored ${marks}% (Grade ${grade || "F"}) in ${subjectName} and needs to improve.`
      : `The student is struggling with ${subjectName} and needs to improve.`;

  return `${perf}
Generate a personalised university study package. Return ONLY a JSON object with this exact structure:
{
  "mindMap": {
    "title": "${subjectName}",
    "nodes": [
      { "label": "Topic Name", "children": [{ "label": "Subtopic A" }, { "label": "Subtopic B" }] }
    ]
  },
  "timetable": [
    { "day": "Mon", "slots": ["Specific activity (duration)"] },
    { "day": "Tue", "slots": ["Specific activity (duration)"] },
    { "day": "Wed", "slots": ["Specific activity (duration)"] },
    { "day": "Thu", "slots": ["Specific activity (duration)"] },
    { "day": "Fri", "slots": ["Specific activity (duration)"] },
    { "day": "Sat", "slots": ["Specific activity (duration)"] },
    { "day": "Sun", "slots": ["Specific activity (duration)"] }
  ],
  "notes": [
    { "title": "Section Title", "bullets": ["Key point 1", "Key point 2", "Key point 3"] }
  ],
  "practiceSet": [
    { "question": "Question text?", "answer": "Detailed answer." }
  ],
  "quizQuestions": [
    { "question": "MCQ question?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0 }
  ]
}
Rules:
- mindMap: 4-6 main topic nodes, each with 2-4 subtopics specific to ${subjectName}
- timetable: all 7 days, with specific and actionable tasks (not generic)
- notes: exactly 4 sections with these EXACT section titles. Each bullet MUST be a complete, standalone academic statement — detailed, subject-specific, and exam-ready:
    1. "Key Definitions" – 6 bullet points, each in format "Term: precise academic definition with scope/context". Use the actual technical vocabulary of ${subjectName}. No vague or dictionary-style definitions.
    2. "Core Concepts & Theory" – 6 bullet points. Each bullet must explain a fundamental concept, theorem, law, or principle deeply: state what it is, how it works, and why it matters in ${subjectName}. Include named theories, models, or frameworks (e.g. OSI model, Newton's laws, ACID properties, etc.).
    3. "Formulas, Methods & Techniques" – 6 bullet points. Each must provide a concrete formula, algorithm, procedure, or worked pattern with correct notation. For maths/science: include the formula and define variables. For CS: include pseudocode or query patterns. For humanities: include analytical frameworks or argumentation structures.
    4. "Exam Strategies & Deep Pitfalls" – 6 bullet points of high-value exam intelligence: common misconceptions lecturers test for, tricky edge cases, marks most students lose, comparison questions to expect, and how to structure ${subjectName}-specific long-answer responses.
  - Every bullet must be 20-35 words, precise, and contain ZERO generic filler. Write as a senior academic tutor who knows exactly what examiners look for in ${subjectName}.
- practiceSet: exactly 6 exam-style questions with detailed model answers
- quizQuestions: exactly 10 multiple-choice questions (MCQs) for the weekly quiz. Each must have:
    - "question": a clear exam-style question specific to ${subjectName}
    - "options": exactly 4 plausible answer options (strings)
    - "correctIndex": the 0-based index of the correct option
  Mix difficulty: 3 easy recall, 4 applied understanding, 3 analytical/tricky.
  Ensure all 4 options are realistic (no obviously wrong distractors).
- All content MUST be specific to ${subjectName}, not generic placeholder text`;
}

// ── POST /api/study-material/generate ──────────────────────────────────────
// Body: { subjectName: string, marks?: number, grade?: string, forceRegenerate?: boolean }
// Returns the generated (or cached) study material document.
exports.generateStudyMaterial = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectName, marks, grade, forceRegenerate } = req.body;

    if (!subjectName || !subjectName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "subjectName is required" });
    }

    const name = subjectName.trim();

    // Return valid cache if it exists, is fresh enough, has quiz questions, AND not forced
    const existing = await StudyMaterial.findOne({
      user: userId,
      subjectName: name,
    });

    if (existing && !forceRegenerate) {
      const hoursSince =
        (Date.now() - new Date(existing.generatedAt).getTime()) /
        (1000 * 60 * 60);
      const hasQuizQuestions = existing.quizQuestions && existing.quizQuestions.length >= 5;
      if (hoursSince < CACHE_HOURS && hasQuizQuestions) {
        return res
          .status(200)
          .json({ success: true, data: existing, cached: true });
      }
      // Cache hit but missing quizQuestions (old doc) or stale — fall through to regenerate
    }

    // Call Groq
    const prompt = buildPrompt(name, marks ?? null, grade ?? null);
    let generated;
    try {
      generated = await callGroqAPI(prompt);
    } catch (groqErr) {
      console.error("Groq generation failed:", groqErr.message);
      // Return stale cache rather than an error if we have something
      if (existing) {
        return res
          .status(200)
          .json({ success: true, data: existing, cached: true });
      }
      return res
        .status(503)
        .json({ success: false, message: groqErr.message });
    }

    // Upsert the generated content
    const material = await StudyMaterial.findOneAndUpdate(
      { user: userId, subjectName: name },
      {
        $set: {
          marks: marks ?? null,
          grade: grade ?? null,
          mindMap: generated.mindMap || { title: name, nodes: [] },
          timetable: generated.timetable || [],
          notes: generated.notes || [],
          practiceSet: generated.practiceSet || [],
          quizQuestions: generated.quizQuestions || [],
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: material, cached: false });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/study-material?subject=SubjectName ─────────────────────────────
// Returns cached material for the subject, or null if not yet generated.
exports.getStudyMaterial = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject } = req.query;

    if (!subject) {
      return res
        .status(400)
        .json({ success: false, message: "subject query param is required" });
    }

    const material = await StudyMaterial.findOne({
      user: userId,
      subjectName: subject.trim(),
    });

    res.status(200).json({ success: true, data: material || null });
  } catch (error) {
    next(error);
  }
};
