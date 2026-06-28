import { betterAuth } from "better-auth";
import { pool } from "./db.server";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || "DEV_SECRET_DO_NOT_USE_IN_PROD_1234567890",
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000",
  plugins: [
    admin(),
    tanstackStartCookies(),
  ],
});
