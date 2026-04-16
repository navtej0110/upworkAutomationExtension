// Listen for scrape trigger from the dashboard page
window.addEventListener("message", (event) => {
  if (event.data?.type === "UPWORK_SCRAPE_TRIGGER") {
    chrome.runtime.sendMessage({ action: "scrape", maxQueries: 5 }, (response) => {
      // Send result back to the dashboard page
      window.postMessage({ type: "UPWORK_SCRAPE_RESULT", data: response }, "*");
    });
  }
});
