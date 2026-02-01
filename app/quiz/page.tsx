"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Quiz from "../components/Quiz";
import { QUIZ_BY_TOPIC, type QuizTopic } from "../quiz-data";

const TOPIC_LABELS: Record<string, string> = {
  hci: "Human Computer Interaction",
  cp2: "Computer Programming 2",
  itera: "Living in IT Era",
};

function QuizContent() {
  const searchParams = useSearchParams();
  const topic = (searchParams.get("topic") || "hci") as QuizTopic;
  const section = searchParams.get("section") || "";

  const quizData = topic && QUIZ_BY_TOPIC[topic] ? QUIZ_BY_TOPIC[topic] : null;

  if (!topic || !section) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Please select a quiz and section from the home page.</p>
          <Link href="/" className="text-cyan-400 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6 flex items-center justify-center">
        <div className="rounded-2xl bg-slate-800/60 border border-slate-600/50 p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-amber-400 mb-2">Coming Soon</h2>
          <p className="text-slate-400 mb-6">
            The <strong>{TOPIC_LABELS[topic] || topic}</strong> quiz is not yet available.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return <Quiz topic={topic} section={section} quizTitle={quizData.title} quizData={quizData} />;
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6 flex items-center justify-center">
        <p className="text-slate-400">Loading quiz...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
