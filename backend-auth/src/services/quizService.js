const Groq = require("groq-sdk");

class QuizService {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn(
        "GROQ_API_KEY not found in environment variables. Quiz generation will fail.",
      );
    }
    this.client = apiKey ? new Groq({ apiKey }) : null;
    this.model = "llama-3.3-70b-versatile";
  }

  /**
   * Generate 5 quiz questions for a completed course using Groq AI
   * @param {Object} course - Course object with name, description, skills
   * @returns {Promise<Array>} Array of 5 quiz questions
   */
  async generateQuiz(course) {
    if (!this.client) {
      throw new Error(
        "GROQ_API_KEY is not configured. Cannot generate quizzes.",
      );
    }

    const prompt = `You are an expert quiz generator for online courses. Generate exactly 5 multiple-choice quiz questions based on the following course information.

Course Name: ${course.name}
Course Description: ${course.description || "Not provided"}
Skills Taught: ${course.skills ? course.skills.join(", ") : "General"}
Difficulty Level: ${course.difficulty || "Intermediate"}

Requirements:
1. Generate exactly 5 questions
2. Each question must have exactly 4 options (A, B, C, D)
3. Questions should test understanding of the course content and skills
4. Vary difficulty across questions
5. Only one correct answer per question

Respond ONLY with a valid JSON array in this exact format (no markdown, no explanation):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Where correctAnswer is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D).`;

    try {
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a quiz generator that outputs only valid JSON arrays. No markdown formatting, no explanation text.",
          },
          { role: "user", content: prompt },
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error("Empty response from AI");
      }

      // Parse the JSON response, handling potential markdown wrapping
      let cleanText = responseText;
      if (cleanText.startsWith("```")) {
        cleanText = cleanText
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      const questions = JSON.parse(cleanText);

      // Validate the structure
      if (!Array.isArray(questions) || questions.length !== 5) {
        throw new Error("Invalid quiz format: expected 5 questions");
      }

      for (const q of questions) {
        if (
          !q.question ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          typeof q.correctAnswer !== "number" ||
          q.correctAnswer < 0 ||
          q.correctAnswer > 3
        ) {
          throw new Error("Invalid question format");
        }
      }

      return questions;
    } catch (error) {
      console.error("Quiz generation error:", error.message);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  /**
   * Grade a quiz submission
   * @param {Array} questions - Original quiz questions with correct answers
   * @param {Array} userAnswers - Array of user's answer indices
   * @returns {Object} Grading result
   */
  gradeQuiz(questions, userAnswers) {
    if (
      !Array.isArray(userAnswers) ||
      userAnswers.length !== questions.length
    ) {
      throw new Error("Invalid submission: must answer all questions");
    }

    let score = 0;
    const gradedQuestions = questions.map((q, idx) => {
      const isCorrect = q.correctAnswer === userAnswers[idx];
      if (isCorrect) score++;
      return {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswers[idx],
        isCorrect,
      };
    });

    return {
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      questions: gradedQuestions,
    };
  }
}

module.exports = new QuizService();
