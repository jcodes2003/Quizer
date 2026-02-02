import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isTeacherAuthenticated } from "../../lib/teacher-auth";

export type StudentQuizRow = {
  id: string;
  student_name: string;
  score: number;
  section: string;
  subject: string;
  created_at?: string;
};

export async function GET() {
  const ok = await isTeacherAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("student_quiz")
    .select("id, student_name, score, section, subject")
    .order("id", { ascending: false });
  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
  return NextResponse.json({ rows: data as StudentQuizRow[] });
}
