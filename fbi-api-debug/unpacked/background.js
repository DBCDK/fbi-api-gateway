chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const ruleSetId = "graphql-debug-header-rules";

  if (message.toggleDebugHeader !== undefined) {
    const updateOptions = message.toggleDebugHeader
      ? { enableRulesetIds: [ruleSetId], disableRulesetIds: [] }
      : { enableRulesetIds: [], disableRulesetIds: [ruleSetId] };

    chrome.declarativeNetRequest.updateEnabledRulesets(updateOptions, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to update ruleset:", chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        sendResponse({ success: true });
      }
    });
    return true; // keep message channel open
  }

  if (message.getDebugHeaderStatus) {
    chrome.declarativeNetRequest.getEnabledRulesets((rulesets) => {
      sendResponse({ enabled: rulesets.includes(ruleSetId) });
    });
    return true;
  }
});
