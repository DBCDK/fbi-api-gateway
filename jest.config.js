/** @type {import('jest').Config} */
const path = require("path");

const config = {
  setupFilesAfterEnv: ["<rootDir>/setup-jest.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/website/src/$1",
  },
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "<rootDir>/website/.next/",
    "<rootDir>/testuser-website/.next/",
  ],
  projects: [
    {
      displayName: "server",
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/setup-jest.js"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/website/src/$1",
      },
      transform: {
        "^.+\\.[jt]sx?$": [
          "babel-jest",
          {
            configFile: path.join(__dirname, ".babelrc"),
          },
        ],
      },
      testPathIgnorePatterns: [
        "<rootDir>/website/src/",
        "<rootDir>/website/.next/",
        "<rootDir>/testuser-website/.next/",
      ],
    },
    {
      displayName: "website",
      testEnvironment: "jsdom",
      setupFilesAfterEnv: ["<rootDir>/setup-jest.js"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/website/src/$1",
      },
      transform: {
        "^.+\\.[jt]sx?$": [
          "babel-jest",
          {
            configFile: path.join(__dirname, ".babelrc"),
          },
        ],
      },
      testPathIgnorePatterns: [
        "<rootDir>/website/.next/",
        "<rootDir>/testuser-website/.next/",
      ],
      testMatch: ["<rootDir>/website/src/**/*.test.js"],
    },
  ],
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        configFile: path.join(__dirname, ".babelrc"),
      },
    ],
  },
};

module.exports = config;
