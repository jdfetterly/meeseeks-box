import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseAllowedDevOrigins(raw) {
  if (!raw) {
    return [
      "http://127.0.0.1:3000",
      "http://localhost:3000",
    ];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: parseAllowedDevOrigins(process.env.CLAWPORT_ALLOWED_DEV_ORIGINS),
};

export default nextConfig;
