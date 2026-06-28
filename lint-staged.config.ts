import type { Configuration } from "lint-staged"

export default {
  "*.@(js|ts|tsx|json)": ["biome check --fix"],
  "*.toml": ["taplo format"],
} satisfies Configuration
