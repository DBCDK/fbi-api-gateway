import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

export default [
  {
    ignores: ["**/.next/**", "fbi-api-debug"], // Ignorerer .next mapper globalt
  },
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "module" },
  },
  {
    files: ["**/*.test.js", "**/*.spec.js", "setup-jest.js"], // Test filer, der matcher Jest tests
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",

      // These rules should probably be enabled when we have the time
      "no-unused-vars": "off", //"warn",
      "react/prop-types": "off",
      "no-constant-condition": "off",
      "no-constant-binary-expression": "off",
      "no-empty": "off",
      "no-unreachable": "off",
      "no-loss-of-precision": "off",
      "no-useless-escape": "off",
      "no-func-assign": "off",
      "no-unexpected-multiline": "off",
      "no-extra-boolean-cast": "off",
      "no-prototype-builtins": "off",
      "no-self-assign": "off",
      "no-useless-catch": "off",
      "no-duplicate-case": "off",
      "no-cond-assign": "off",
      "no-fallthrough": "off",
      "no-control-regex": "off",
      "no-unsafe-optional-chaining": "off",
      "no-regex-spaces": "off",
      "no-empty-pattern": "off",

      // These are the most important rules
      "no-undef": "error",
      "no-redeclare": "warn", // Should probably be set to error
      "react/jsx-key": "error",
    },
  },
];
