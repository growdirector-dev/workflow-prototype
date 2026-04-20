import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const sharedLanguageOptions = {
  ecmaVersion: 2020,
  sourceType: "module",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  globals: {
    ...globals.browser,
    ...globals.jest,
    ...globals.node,
  },
};

const sharedPlugins = {
  react,
  "react-hooks": reactHooks,
  "react-refresh": reactRefresh,
};

const sharedRules = {
  "react/jsx-uses-vars": "error",
  "react/react-in-jsx-scope": "off",
  ...reactHooks.configs.recommended.rules,
  "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: sharedLanguageOptions,
    plugins: sharedPlugins,
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: sharedRules,
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: sharedLanguageOptions,
    plugins: sharedPlugins,
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...sharedRules,
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
