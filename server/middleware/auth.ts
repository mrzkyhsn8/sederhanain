import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  userEmail?: string;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Silakan login dengan Google terlebih dahulu." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error("Invalid token response from Google");
    }

    const payload = (await response.json()) as { email?: string };
    if (payload && payload.email) {
      req.userEmail = payload.email;
      next();
    } else {
      res.status(401).json({ error: "Token tidak valid atau tidak memiliki email." });
    }
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Gagal memverifikasi login Google. Silakan login kembali." });
  }
};
