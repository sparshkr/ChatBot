document.getElementById("save").addEventListener("click", () => {
  const apiKey = document.getElementById("api-key").value.trim();

  if (apiKey) {
    chrome.storage.sync.set({ aiApiKey: apiKey }, () => {
      const status = document.getElementById("status");
      status.style.display = "block";
      setTimeout(() => {
        status.style.display = "none";
      }, 2000);
    });
  }
});
