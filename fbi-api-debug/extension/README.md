# FBI-API Debug – Chrome Extension

This folder contains the Chrome Extension-specific files for the **FBI-API Debug** developer tool.

- **Permissions for network monitoring**:

  - The extension requests the necessary Chrome DevTools permissions to **monitor and inspect network requests** made by the website.
  - Without the extension, browser security policies would block access to detailed request/response data.

- **Automatic `X-Debug` header injection**:
  - When the "FBI-API Debug" panel is open in Developer Tools, the extension automatically injects a custom `X-Debug: true` HTTP header into all outgoing requests.
  - This header can be used by the server or APIs to enable extra debug information (such as service call traces).
