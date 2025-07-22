import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../config/constants";

const rateLimiter = rateLimit(rateLimitConfig);

export default rateLimiter;