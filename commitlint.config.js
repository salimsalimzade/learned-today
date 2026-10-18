export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ["feature", "bugfix", "refactor", "chore", "docs"]],
    "scope-empty": [2, "never"],
    "header-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "lower-case"],
    "body-case": [2, "always", "lower-case"],
  },
};
