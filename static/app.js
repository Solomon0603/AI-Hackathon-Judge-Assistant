const form = document.getElementById("analysis-form");
const analyzeButton = document.getElementById("analyze-button");
const resultPanel = document.getElementById("result-panel");
const resultBody = document.getElementById("result-body");
const resultStatusText = document.getElementById("result-status-text");
const pageLoader = document.getElementById("page-loader");
const screenshotDrop = document.getElementById("screenshot-drop");
const pdfDrop = document.getElementById("pdf-drop");
const imageChip = document.getElementById("image-chip");
const pdfChip = document.getElementById("pdf-chip");
const analysisTyping = document.getElementById("analysis-typing");
const innovationScoreEl = document.getElementById("innovation-score");
const technicalScoreEl = document.getElementById("technical-score");
const innovationBar = document.getElementById("innovation-bar");
const technicalBar = document.getElementById("technical-bar");

let typingTimer = null;
let typingIndex = 0;
let typingText = "";

function setButtonLoading(isLoading) {
  if (!analyzeButton) return;
  if (isLoading) {
    analyzeButton.classList.add("is-loading");
    analyzeButton.disabled = true;
  } else {
    analyzeButton.classList.remove("is-loading");
    analyzeButton.disabled = false;
  }
}

function setPageLoading(isLoading) {
  if (!pageLoader) return;
  if (isLoading) {
    pageLoader.classList.add("is-active");
  } else {
    pageLoader.classList.remove("is-active");
  }
}

function revealResultPanel() {
  if (!resultPanel) return;
  resultPanel.classList.add("is-visible");
}

function setResultPlaceholder(message) {
  if (!resultBody || !analysisTyping) return;
  resultBody.classList.add("is-empty");
  resultBody.classList.remove("result-error");
  analysisTyping.textContent = message;
  resetScores();
}

function setResultText(text) {
  if (!resultBody || !analysisTyping) return;
  resultBody.classList.remove("is-empty", "result-error");
  startTyping(text);
  updateScoresFromText(text);
}

function setResultError(message) {
  if (!resultBody || !analysisTyping) return;
  resultBody.classList.remove("is-empty");
  resultBody.classList.add("result-error");
  stopTyping();
  analysisTyping.textContent = message;
  resetScores();
}

/**
 * Drag & drop helpers
 */
function wireDropzone(dropzoneEl, inputId, chipEl) {
  if (!dropzoneEl) return;
  const fileInput = document.getElementById(inputId);
  if (!fileInput) return;

  const updateChip = (file) => {
    if (!chipEl) return;
    if (file) {
      chipEl.textContent = file.name;
      chipEl.style.borderStyle = "solid";
    } else {
      chipEl.textContent = "No file selected";
      chipEl.style.borderStyle = "dashed";
    }
  };

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    updateChip(file || null);
  });

  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropzoneEl.addEventListener(eventName, preventDefaults, false);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzoneEl.addEventListener(
      eventName,
      () => {
        dropzoneEl.classList.add("is-drag-over");
      },
      false
    );
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzoneEl.addEventListener(
      eventName,
      () => {
        dropzoneEl.classList.remove("is-drag-over");
      },
      false
    );
  });

  dropzoneEl.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt && dt.files;
    if (!files || files.length === 0) return;

    fileInput.files = files;
    updateChip(files[0]);
  });

  dropzoneEl.addEventListener("click", () => {
    fileInput.click();
  });
}

function resetScores() {
  if (innovationScoreEl) innovationScoreEl.textContent = "–";
  if (technicalScoreEl) technicalScoreEl.textContent = "–";
  if (innovationBar) innovationBar.style.width = "0%";
  if (technicalBar) technicalBar.style.width = "0%";
}

function deriveScoresFromText(text) {
  if (!text) {
    return { innovation: 0, technical: 0 };
  }
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  // Map hash deterministically into 40–100 range so results feel positive but varied
  const innovation = 40 + (hash % 61);
  const technical = 40 + ((hash >> 8) % 61);
  return { innovation, technical };
}

function updateScoresFromText(text) {
  if (!innovationScoreEl || !technicalScoreEl || !innovationBar || !technicalBar) return;
  const { innovation, technical } = deriveScoresFromText(text);
  innovationScoreEl.textContent = `${innovation}/100`;
  technicalScoreEl.textContent = `${technical}/100`;
  // Trigger CSS transition on width change
  innovationBar.style.width = `${innovation}%`;
  technicalBar.style.width = `${technical}%`;
}

function stopTyping() {
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }
}

function startTyping(text) {
  if (!analysisTyping) return;
  stopTyping();
  typingText = text || "";
  typingIndex = 0;
  analysisTyping.textContent = "";

  if (!typingText) return;

  const step = () => {
    typingIndex += 1;
    analysisTyping.textContent = typingText.slice(0, typingIndex);
    if (typingIndex < typingText.length) {
      typingTimer = setTimeout(step, 16); // ~60 chars per second
    } else {
      typingTimer = null;
    }
  };

  step();
}

// Initialize UI wiring
wireDropzone(screenshotDrop, "image", imageChip);
wireDropzone(pdfDrop, "pdf", pdfChip);

// Form submission
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const description = document.getElementById("description");
    if (description && !description.value.trim()) {
      description.focus();
      setResultError("Please provide a brief description of your project.");
      resultStatusText.textContent = "Missing description";
      revealResultPanel();
      return;
    }

    setButtonLoading(true);
    setPageLoading(true);
    resultStatusText.textContent = "Analyzing project with AI judge…";
    setResultPlaceholder("Thinking through your project like a hackathon judge...");
    revealResultPanel();

    try {
      const formData = new FormData(form);

      const response = await fetch("/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = await response.json();
      const text = typeof data === "object" && data !== null ? data.result || "" : "";

      if (!text) {
        setResultError("The AI did not return a response. Please try again.");
        resultStatusText.textContent = "No response";
      } else {
        setResultText(text);
        resultStatusText.textContent = "Evaluation ready";
      }
    } catch (error) {
      setResultError("Something went wrong while contacting the AI judge. Please try again in a moment.");
      resultStatusText.textContent = "Error during evaluation";
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setButtonLoading(false);
      setPageLoading(false);
    }
  });
}