import { NextRequest, NextResponse } from "next/server";
import {
  verifyTeacherPassword,
  createTeacherSession,
  getCookieName,
} from "../../lib/teacher-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";
    if (!password) {
      return NextResponse.json({ ok: false, error: "Password required" }, { status: 400 });
    }
    if (!verifyTeacherPassword(password)) {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
    }
    const token = createTeacherSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(getCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("Teacher login error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
