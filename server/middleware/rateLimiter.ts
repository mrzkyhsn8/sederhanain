import rateLimit from "express-rate-limit";
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { WHITELIST_EMAILS } from "../config";

export const apiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 jam
  max: 5, // Batas 5 request per user
  message: { error: "Limit tercapai. Anda hanya bisa melakukan 5 pencarian dalam 24 jam. Silakan coba lagi besok." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthenticatedRequest) => {
    return req.userEmail || "anonymous";
  },
  skip: (req: AuthenticatedRequest) => {
    if (!req.userEmail) return false;
    return WHITELIST_EMAILS.includes(req.userEmail.toLowerCase());
  }
});
