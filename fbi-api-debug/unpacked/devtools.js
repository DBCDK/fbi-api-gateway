chrome.devtools.panels.create(
  "FBI-API Debug Tool",
  null,
  "index.html",
  function (panel) {
    console.log("FBI-API Debug Tool panel created");
    panel.onShown.addListener((window) => {
      console.log("FBI-API Debug panel opened");
      chrome.runtime.sendMessage({ toggleDebugHeader: true }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Runtime error:", chrome.runtime.lastError.message);
        } else {
          console.log("Header toggle response:", response);
        }
      });
    });

    panel.onHidden.addListener(() => {
      console.log("FBI-API Debug panel closed or hidden");
      chrome.runtime.sendMessage({ toggleDebugHeader: false }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Runtime error:", chrome.runtime.lastError.message);
        } else {
          console.log("Header toggle response:", response);
        }
      });
    });
  }
);
