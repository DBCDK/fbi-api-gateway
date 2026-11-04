import React, { act } from "react";
import { createRoot } from "react-dom/client";
import WhatsNew from "./WhatsNew";
import useCredentialNetwork from "@/hooks/credentials/useCredentialNetwork";
import useInternalNetworkCheck from "@/hooks/credentials/useInternalNetworkCheck";
import { getWhatsNewStorageKey, WHATS_NEW_RESTORED_EVENT } from "./utils";

jest.mock("./WhatsNew.module.css", () => ({}));
jest.mock("@/hooks/credentials/useCredentialNetwork", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/credentials/useInternalNetworkCheck", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("./whatsNewNews", () => ({
  __esModule: true,
  default: [
    { id: "public", title: "Public news", body: "Public body" },
    {
      id: "internal",
      title: "Internal news",
      body: "[Services](/documentation#h2-services)",
      internalOnly: true,
    },
  ],
}));
jest.mock("@/components/base/carousel", () => ({
  __esModule: true,
  default: ({ items, renderItem, onClose }) => (
    <div>
      {items.map((item) => (
        <div key={item.id}>{renderItem(item, { interactive: true })}</div>
      ))}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));
jest.mock("@/components/base/title", () => ({
  __esModule: true,
  default: ({ children }) => <h3>{children}</h3>,
}));
jest.mock("@/components/base/text", () => ({
  __esModule: true,
  default: ({ children }) => <p>{children}</p>,
}));
jest.mock("@/components/base/link", () => ({
  __esModule: true,
  default: ({ children, href, target }) => (
    <a href={href} target={target}>
      {children}
    </a>
  ),
}));

it("filters internal news on network changes and dismisses only eligible news", () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  const container = document.createElement("div");
  const root = createRoot(container);
  const render = (isInternal, external = false, isLoading = false) => {
    useCredentialNetwork.mockReturnValue({ isInternal, isLoading });
    useInternalNetworkCheck.mockReturnValue({
      disableInternalNetworkCheck: external,
    });
    act(() => root.render(<WhatsNew />));
  };
  try {
    render(false, false, true);
    expect(container.textContent).toContain("Public news");
    expect(container.textContent).not.toContain("Internal news");
    act(() => container.querySelector("button").click());
    expect(localStorage.getItem(getWhatsNewStorageKey("internal"))).toBeNull();
    render(true, true);
    expect(container.textContent).toBe("");
    render(true);
    expect(container.textContent).toContain("Internal news");
    expect(container.textContent).not.toContain("Public news");
    expect(container.querySelector("a").getAttribute("href")).toBe(
      "/documentation#h2-services"
    );
    expect(container.querySelector("a").target).toBe("_self");
    render(true, true);
    expect(container.textContent).toBe("");
    act(() => window.dispatchEvent(new CustomEvent(WHATS_NEW_RESTORED_EVENT)));
    expect(container.textContent).toBe("");
    render(true);
    act(() => container.querySelector("button").click());
    expect(
      localStorage.getItem(getWhatsNewStorageKey("internal"))
    ).not.toBeNull();
    render(false);
    render(true);
    expect(container.textContent).toBe("");
  } finally {
    act(() => root.unmount());
    localStorage.clear();
  }
});
