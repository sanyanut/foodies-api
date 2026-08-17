import pino from "pino";

import { env, isProduction, isTest } from "../config/env.ts";

// One shared logger instance. Silent during tests; pretty-printed in dev; plain
// JSON in production (so Render / log collectors can parse it).
const logger = pino(
  isTest
    ? { level: "silent" }
    : {
        level: env.LOG_LEVEL,
        transport: isProduction
          ? undefined
          : { target: "pino-pretty", options: { translateTime: "SYS:standard" } },
      },
);

export default logger;
