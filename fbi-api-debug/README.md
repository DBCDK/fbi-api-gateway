# FBI-API Debug Chrome Extension

**FBI-API Debug** is a Chrome Developer Tools extension that allows you to inspect calls made to the `fbi-api` from any website.  
It gives you detailed insights into both the outgoing GraphQL requests and the underlying service calls for selected services.

---

## Key Features

- 🔎 Inspect all GraphQL requests sent to `fbi-api`.
- 🛠️ View query, variables, and cleaned response data.
- 🔍 Drill down into service calls for selected backend services, including request/response payloads and timing information.

---

## Installation

1. Clone this repository:

   ```bash
   git@github.com:DBCDK/fbi-api-gateway.git
   ```

2. Open Chrome and go to `chrome://extensions/`.

3. Enable **Developer mode** in the top right corner.

4. Click **Load unpacked** and select the 'unpacked' folder, .../fbi-api-gateway/fbi-api-debug/unpacked.

---

## Usage

1. Navigate to the website you want to debug.
2. Open Chrome Developer Tools (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`).
3. Switch to the **FBI-API Debug** tab.
4. Use the website as normal — navigate around and trigger actions.
5. Watch the list of `fbi-api` GraphQL requests populate automatically.
6. Click on a request to inspect its query, variables, response, and underlying service calls in detail.
