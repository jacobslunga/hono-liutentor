# LiUTentor API

A secure, high-performance backend API for LiUTentor - helping students understand exam questions with AI-powered assistance.

## What is LiUTentor?

LiUTentor is a study assistance platform designed for students at Linköping University (LiU). This API provides the backend services that power the platform, enabling students to:

- **Browse Past Exams**: Access a comprehensive database of previous exam papers organized by course code
- **View Solutions**: Get access to official solutions when available
- **AI Study Assistant**: Chat with an AI that has context of both the exam and its solutions to get step-by-step explanations in Swedish
- **Track Statistics**: View historical exam statistics including pass rates and grade distributions

## How It Works

The API connects three main components:

1. **Supabase Database**: Stores exam documents, solutions, statistics, and course information
2. **OpenAI GPT**: Powers the AI assistant that helps students understand exam questions
3. **Frontend Application**: Serves the LiUTentor web interface at liutentor.se

When a student asks a question about an exam, the AI receives both the exam PDF and solution PDF (if available), allowing it to provide accurate, contextual explanations based on the actual materials.

## API Endpoints

- `GET /health` - Check if the API is running
- `GET /ready` - Verify database connectivity
- `GET /exams/:courseCode` - Get all exams for a specific course
- `GET /exams/exam/:examId` - Get details for a specific exam
- `POST /exams/exam/:examId/chat` - Chat with AI about an exam question

## Technology Stack

Built with modern, performant technologies:

- **[Hono](https://hono.dev)** - Ultra-fast web framework for edge computing
- **[Bun](https://bun.sh)** - Fast all-in-one JavaScript runtime
- **[Supabase](https://supabase.com)** - PostgreSQL database with real-time capabilities
- **[OpenAI GPT](https://openai.com)** - AI model for intelligent exam assistance
- **[Zod](https://zod.dev)** - TypeScript-first schema validation

---

Built with ❤️ for LiU students by [Jacob Slunga](https://github.com/jacobslunga)
