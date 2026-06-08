/** @type {import('jest').Config} */
const path = require("path");

const config = {
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
};

module.exports = config;
