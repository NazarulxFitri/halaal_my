import type { NextApiRequest, NextApiResponse } from "next";

import {
  createSessionToken,
  setAdminSessionCookie,
  verifyAdminCredentials,
} from "@/lib/adminAuth";

type LoginResponse = {
  ok: boolean;
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>,
) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const username = String(req.body?.username ?? "").trim();
  const image = String(req.body?.image ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!verifyAdminCredentials(username, image, password)) {
    res.status(401).json({ ok: false, error: "Invalid credentials" });
    return;
  }

  const token = createSessionToken();
  setAdminSessionCookie(res, token);
  res.status(200).json({ ok: true });
}
