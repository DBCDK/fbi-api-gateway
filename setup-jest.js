import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
jest.mock("./src/utils/fetchWorker", () => ({
  __esModule: true, // this property makes it work
  default: "mockedDefaultExport",
  namedExport: jest.fn(),
}));

jest.mock("fast-jwt", () => ({
  __esModule: true, // this property makes it work
  default: "mockedDefaultExport",
  createSigner: jest.fn(),
}));
