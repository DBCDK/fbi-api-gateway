import React, { act } from "react";
import { createRoot } from "react-dom/client";
import InternalMonitoring from "./InternalMonitoring";
import useCredentialNetwork from "@/hooks/credentials/useCredentialNetwork";
import useInternalNetworkCheck from "@/hooks/credentials/useInternalNetworkCheck";

jest.mock("@/hooks/credentials/useInternalNetworkCheck", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useCredentialNetwork", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/components/base/title", () => ({
  __esModule: true,
  default: ({ as: Tag, children }) => <Tag>{children}</Tag>,
}));
jest.mock("@/components/base/text", () => ({
  __esModule: true,
  default: ({ children }) => <p>{children}</p>,
}));
jest.mock("@/components/base/link", () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

it("shows headings and internal links only on the internal network, including network changes", () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  const render = (network, external = false) => {
    useCredentialNetwork.mockReturnValue(network);
    useInternalNetworkCheck.mockReturnValue({
      disableInternalNetworkCheck: external,
    });
    act(() => root.render(<InternalMonitoring />));
  };
  try {
    render({ isInternal: false, isLoading: true });
    expect(container.innerHTML).toBe("");
    render({
      isInternal: true,
      monitoringBaseUrl: "https://internal.example:9599/",
    });
    expect(
      [...container.querySelectorAll("h2")].map((h) => h.textContent)
    ).toEqual(["Services 🔗", "Howru 🩺"]);
    expect([...container.querySelectorAll("a")].map((a) => a.href)).toEqual([
      "https://internal.example:9599/services",
      "https://internal.example:9599/howru",
    ]);
    render(
      { isInternal: true, monitoringBaseUrl: "https://internal.example:9599" },
      true
    );
    expect(container.innerHTML).toBe("");
    render({
      isInternal: true,
      monitoringBaseUrl: "https://internal.example:9599",
    });
    expect(container.querySelectorAll("h2")).toHaveLength(2);
    render({
      isInternal: false,
      monitoringBaseUrl: "https://internal.example:9599/",
    });
    expect(container.innerHTML).toBe("");
    render({ isInternal: true });
    expect(container.querySelectorAll("h2")).toHaveLength(2);
    expect(container.querySelector("a")).toBeNull();
  } finally {
    act(() => root.unmount());
  }
});
