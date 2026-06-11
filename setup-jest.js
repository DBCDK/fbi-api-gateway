import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
jest.mock("./src/utils/fetchWorker", () => ({
  __esModule: true, // this property makes it work
  default: "mockedDefaultExport",
  namedExport: jest.fn(),
}));

jest.mock("fast-jwt", () => ({
  __esModule: true,
  createSigner: () => (payload) => `mock-jwt-${JSON.stringify(payload)}`,
}));

jest.mock("uuid", () => ({
  __esModule: true,
  v4: jest.fn(() => "00000000-0000-4000-8000-000000000000"),
  v5: jest.fn(() => "00000000-0000-4000-8000-000000000001"),
}));

jest.mock("nanoid", () => ({
  __esModule: true, // this property makes it work
  default: "mockedDefaultExport",
  nanoid: jest.fn(),
}));
