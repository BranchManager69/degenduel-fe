import express from "express";
import { logApi } from "../utils/logger-suite/logger.js";

export function configureMiddleware(app) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:5173", // Vite dev server
    "https://degenduel.me",
    "https://data.degenduel.me",
    "https://dev.degenduel.me",
    "https://branch.bet",
    "https://app.branch.bet",
  ];

  // CORS middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Only allow requests from our allowed origins
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type, X-Requested-With, Cache-Control, X-Wallet-Address"
      );
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Content-Length, X-Wallet-Address"
      );
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    next();
  });

  // Body parsing
  app.use(express.json());

  // Logging
  app.use((req, res, next) => {
    logApi.info(`${req.method} ${req.url}`, {
      origin: req.headers.origin,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    next();
  });
}
