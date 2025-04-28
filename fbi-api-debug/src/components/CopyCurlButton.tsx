import React from "react";

/**
 * CopyCurlButton component
 *
 * Renders a button that copies a curl command to the clipboard,
 * compatible with Chrome DevTools extensions.
 */
export function CopyCurlButton({
  request,
}: {
  request: {
    url: string;
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    };
  };
}) {
  const generateCurlCommand = () => {
    const { url, options = {} } = request;
    const { method = "GET", headers = {}, body } = options;

    const curlParts = [`curl -X ${method.toUpperCase()}`];

    for (const [key, value] of Object.entries(headers)) {
      curlParts.push(`-H "${key}: ${value}"`);
    }

    if (body) {
      curlParts.push(`--data '${body}'`);
    }

    curlParts.push(`"${url}"`);

    return curlParts.join(" ");
  };

  const handleCopy = () => {
    const curlCommand = generateCurlCommand();

    // Create a hidden textarea
    const textarea = document.createElement("textarea");
    textarea.value = curlCommand;
    textarea.style.position = "fixed"; // Avoid scrolling to bottom
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        // alert("cURL command copied to clipboard!");
      } else {
        alert("Failed to copy.");
      }
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
      alert("Failed to copy.");
    }

    document.body.removeChild(textarea);
  };

  return <button onClick={handleCopy}>Copy cURL to clipboard</button>;
}
