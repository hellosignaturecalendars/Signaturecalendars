import { NextResponse } from "next/server";
import { preview, devToken, firebase, sameOrigin } from "@/lib/server";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    let token: string;
    if (preview) {
      if (process.env.NODE_ENV !== "development")
        return NextResponse.json(
          {
            error:
              "Preview editing is available only on the local development server.",
          },
          { status: 403 },
        );
      token = devToken();
    } else {
      const { idToken } = await req.json();
      const auth = firebase().auth;
      const claims = await auth.verifyIdToken(idToken, true);
      const user = await auth.getUser(claims.uid);
      if (
        user.disabled ||
        user.customClaims?.admin !== true ||
        Date.now() / 1000 - claims.auth_time > 300
      )
        throw Error("An authorized administrator account is required.");
      token = await auth.createSessionCookie(idToken, { expiresIn: 86400000 });
    }
    const r = NextResponse.json({ ok: true });
    r.cookies.set("sc-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 86400,
    });
    return r;
  } catch {
    return NextResponse.json(
      {
        error: "Login failed. An authorized administrator account is required.",
      },
      { status: 401 },
    );
  }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    const r = NextResponse.json({ ok: true });
    r.cookies.delete("sc-session");
    return r;
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
}
