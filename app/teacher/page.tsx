"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type StudentQuizRow = {
  id: string;
  student_name: string;
  score: number;
  section: string;
  subject: string;
  created_at?: string;
};

const SUBJECT_LABELS: Record<string, string> = {
  hci: "Human Computer Interaction",
  cp2: "Computer Programming 2",
  itera: "Living in IT Era",
};

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(rows: StudentQuizRow[]) {
  const headers = ["Student Name", "Score", "Section", "Subject", "Submitted At"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        escapeCsvCell(r.student_name),
        escapeCsvCell(r.score),
        escapeCsvCell(r.section),
        escapeCsvCell(SUBJECT_LABELS[r.subject] ?? r.subject),
        escapeCsvCell(r.created_at ? new Date(r.created_at).toLocaleString() : ""),
      ].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quiz-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TeacherPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [rows, setRows] = useState<StudentQuizRow[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("");

  const fetchScores = useCallback(async () => {
    setScoresLoading(true);
    try {
      const res = await fetch("/api/teacher-scores", { credentials: "include" });
      if (res.status === 401) {
        setAuthenticated(false);
        setRows([]);
        return;
      }
      if (!res.ok) {
        setError("Failed to load responses.");
        return;
      }
      const data = await res.json();
      setRows(data.rows ?? []);
      setAuthenticated(true);
    } catch {
      setError("Failed to load responses.");
    } finally {
      setScoresLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/teacher-scores", { credentials: "include" });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows ?? []);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/teacher-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      setAuthenticated(true);
      await fetchScores();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/teacher-logout", { method: "POST", credentials: "include" });
    setAuthenticated(false);
    setRows([]);
  };

  const filteredRows = filterSubject
    ? rows.filter((r) => r.subject === filterSubject)
    : rows;

  if (authenticated === null && !scoresLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6 flex items-center justify-center">
        <p className="text-slate-400">Checking access...</p>
      </div>
    );
  }

  if (authenticated !== true) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl bg-slate-800/60 border border-slate-600/50 p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-center mb-2 text-cyan-300">Teacher Access</h1>
          <p className="text-slate-400 text-sm text-center mb-6">Enter password to view responses</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold"
            >
              {loading ? "Checking..." : "Enter"}
            </button>
          </form>
          <p className="mt-6 text-center">
            <Link href="/" className="text-slate-500 hover:text-cyan-400 text-sm">← Back to Home</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-cyan-400 text-sm">← Home</Link>
            <h1 className="text-2xl font-bold text-cyan-300">Quiz Responses</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All subjects</option>
              <option value="hci">Human Computer Interaction</option>
              <option value="cp2">Computer Programming 2</option>
              <option value="itera">Living in IT Era</option>
            </select>
            <button
              onClick={() => downloadCsv(filteredRows)}
              disabled={filteredRows.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold"
            >
              Export CSV
            </button>
            <button
              onClick={() => fetchScores()}
              disabled={scoresLoading}
              className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-semibold"
            >
              {scoresLoading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {scoresLoading && rows.length === 0 ? (
          <p className="text-slate-400 text-center py-12">Loading responses...</p>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl bg-slate-800/60 border border-slate-600/50 p-12 text-center text-slate-400">
            No responses yet.
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-800/60 border border-slate-600/50 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-600 bg-slate-700/50">
                    <th className="px-4 py-3 text-slate-300 font-semibold">Student Name</th>
                    <th className="px-4 py-3 text-slate-300 font-semibold">Score</th>
                    <th className="px-4 py-3 text-slate-300 font-semibold">Section</th>
                    <th className="px-4 py-3 text-slate-300 font-semibold">Subject</th>
                    <th className="px-4 py-3 text-slate-300 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-slate-200">{r.student_name}</td>
                      <td className="px-4 py-3 text-emerald-400 font-medium">{r.score}</td>
                      <td className="px-4 py-3 text-slate-300">{r.section}</td>
                      <td className="px-4 py-3 text-slate-300">{SUBJECT_LABELS[r.subject] ?? r.subject}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-4 text-slate-500 text-sm text-center">
          One row per quiz submission. Export includes all visible rows (filtered by subject if selected).
        </p>
      </div>
    </div>
  );
}
