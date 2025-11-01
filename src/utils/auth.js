import dotenv from 'dotenv'; dotenv.config();
import jwt from "jsonwebtoken";
import { ClientError } from "./errors.js";

const publicKeyB64 = process.env.PUBLIC_KEY_B64;

const publicKey = Buffer.from(publicKeyB64, 'base64').toString('utf-8');

export function validateToken(authHeader) {
  if (!authHeader) throw new ClientError("Missing Authorization header", 401);
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, publicKey);
    return decoded;
  } catch {
    throw new ClientError("Invalid or expired token", 401);
  }
}