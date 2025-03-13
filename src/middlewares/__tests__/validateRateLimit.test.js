import { validateRateLimit } from "../validateRateLimit";
import { incr } from "../../datasources/redis.datasource";
import isbot from "isbot";
import { log } from "dbc-node-logger";
import config from "../../config";

// Jest mock functions
jest.mock("../../datasources/redis.datasource", () => ({
  incr: jest.fn(),
}));

jest.mock("dbc-node-logger", () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("isbot", () => jest.fn());

describe("Rate Limiting Middleware", () => {
  const clientId = "test-client";
  const redisKey = `${config.rateLimit.prefix}:${clientId}`;
  const RATE_LIMIT = config.rateLimit.max;

  beforeEach(() => {
    jest.clearAllMocks();
    isbot.mockReturnValue(false);
  });

  const mockRequest = (overrides = {}) => ({
    smaug: { app: { clientId, ips: ["1.2.3.4"] }, gateway: {} },
    get: jest.fn((header) =>
      header === "User-Agent" ? "Mocked User-Agent" : ""
    ),
    accessToken: "fake-token",
    ...overrides,
  });

  const mockResponse = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    return res;
  };

  const next = jest.fn();

  it("✅ Should allow request if under rate limit", async () => {
    incr.mockResolvedValue(10);

    const req = mockRequest();
    const res = mockResponse();

    await validateRateLimit(req, res, next);

    expect(req.get).toHaveBeenCalledWith("User-Agent");
    expect(incr).toHaveBeenCalledWith(redisKey, expect.any(Number));
    expect(next).toHaveBeenCalled();
  });

  it("🚫 Should block request if over rate limit", async () => {
    incr.mockResolvedValue(RATE_LIMIT + 1);

    const req = mockRequest();
    const res = mockResponse();

    await validateRateLimit(req, res, next);

    expect(log.info).toHaveBeenCalledWith(
      "Rate limit exceeded",
      expect.objectContaining({
        clientId: expect.any(String),
        userAgent: expect.any(String),
        userAgentIsBot: expect.any(Boolean),
      })
    );
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.send).toHaveBeenCalledWith({
      statusCode: 429,
      message: "Too many requests!",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("✅ Should set TTL only on first request", async () => {
    incr.mockResolvedValue(1);

    const req = mockRequest();
    const res = mockResponse();

    await validateRateLimit(req, res, next);

    expect(incr).toHaveBeenCalledWith(redisKey, expect.any(Number));
    expect(next).toHaveBeenCalled();
  });

  it("🚨 Should return 401 if clientId is missing", async () => {
    const req = mockRequest({ smaug: {} });
    const res = mockResponse();

    await validateRateLimit(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("✅ Should detect bot user agent", async () => {
    isbot.mockReturnValue(true);

    incr.mockResolvedValue(10);
    const req = mockRequest();
    const res = mockResponse();

    await validateRateLimit(req, res, next);

    expect(req.get).toHaveBeenCalledWith("User-Agent");
    expect(isbot).toHaveBeenCalledWith("Mocked User-Agent");
    expect(next).toHaveBeenCalled();
  });

  it("✅ Should handle missing User-Agent gracefully", async () => {
    const req = mockRequest({ get: jest.fn(() => undefined) });
    const res = mockResponse();

    await validateRateLimit(req, res, next);

    expect(req.get).toHaveBeenCalledWith("User-Agent");
    expect(isbot).toHaveBeenCalledWith("");
    expect(next).toHaveBeenCalled();
  });

  it("⚠️ Should gracefully handle Redis failure", async () => {
    incr.mockRejectedValue(new Error("Redis failure")); // 🚀 Simuler Redis-fejl

    const req = mockRequest();
    const res = mockResponse();

    await validateRateLimit(req, res, next);

    expect(incr).toHaveBeenCalledWith(redisKey, expect.any(Number));
    expect(log.error).toHaveBeenCalledWith(
      "Redis error in rate limiting",
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(next).toHaveBeenCalled(); // 🚀 Middleware må ikke blokere brugeren
  });
});
