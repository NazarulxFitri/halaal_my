import type { NextApiRequest, NextApiResponse } from "next";

import { clearAdminSessionCookie } from "@/lib/adminAuth";

type LogoutResponse = {
  ok: boolean;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>,
) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  clearAdminSessionCookie(res);
  res.status(200).json({ ok: true });
}
