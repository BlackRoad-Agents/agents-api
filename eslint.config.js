export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        URL: "readonly",
        Response: "readonly",
        Request: "readonly",
        fetch: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": "warn",
      "eqeqeq": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];
