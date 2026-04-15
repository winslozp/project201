// --- Prompts to cycle through ---
const PROMPTS = [
  "the quick brown fox jumps over the lazy dog",
  "practice makes perfect when you type every day",
  "consistency is the key to mastering any skill",
  "focus on accuracy before you chase raw speed",
  "every keystroke brings you one step closer to mastery",
  "a smooth sea never made a skilled sailor",
  "success is the sum of small efforts repeated daily",
  "the secret to getting ahead is getting started",
];

// --- State ---
let currentPrompt = "";
let currentIndex = 0;   // which character the user is on
let streak = 0;
let bestStreak = 0;

// --- DOM references ---
const promptEl     = document.getElementById("ks-prompt");
const streakEl     = document.getElementById("ks-streak");
const bestEl       = document.getElementById("ks-best");
const lastEl       = document.getElementById("ks-last");
const lastWrapEl   = document.getElementById("ks-last-wrap");
const progressBar  = document.getElementById("ks-progress-bar");
const resetBtn     = document.getElementById("ks-reset-btn");

// Pick a random prompt (avoids repeating the same one twice in a row)
function getRandomPrompt(exclude) {
  const options = PROMPTS.filter(p => p !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

// Render the prompt as individual <span> elements so we can color each letter
function renderPrompt() {
  promptEl.innerHTML = "";
  for (let i = 0; i < currentPrompt.length; i++) {
    const span = document.createElement("span");
    span.textContent = currentPrompt[i];
    // dim = upcoming, bright white = current cursor position
    span.className = i === 0 ? "ks-char ks-current" : "ks-char ks-upcoming";
    promptEl.appendChild(span);
  }
  updateProgress();
}

// Update the progress bar width based on how far the user is
function updateProgress() {
  const pct = currentPrompt.length > 0
    ? (currentIndex / currentPrompt.length) * 100
    : 0;
  progressBar.style.width = pct + "%";
}

// Load a brand new prompt and reset position (but keep best streak)
function loadNewPrompt(exclude) {
  currentPrompt = getRandomPrompt(exclude);
  currentIndex  = 0;
  streak        = 0;
  streakEl.textContent = 0;
  renderPrompt();
}

// Flash the prompt box briefly (green for correct, red for wrong)
function flashPrompt(type) {
  promptEl.classList.add(type === "good" ? "ks-flash-good" : "ks-flash-bad");
  setTimeout(() => promptEl.classList.remove("ks-flash-good", "ks-flash-bad"), 250);
}

// Called on every keypress
function handleKey(e) {
  // Ignore modifier keys and keys that aren't a single printable character
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;

  const expected = currentPrompt[currentIndex];

  if (e.key === expected) {
    // --- Correct keystroke ---
    flashPrompt("good");

    // Mark this character green
    const spans = promptEl.querySelectorAll(".ks-char");
    spans[currentIndex].className = "ks-char ks-done";

    currentIndex++;
    streak++;

    // Update best if needed
    if (streak > bestStreak) {
      bestStreak = streak;
      bestEl.textContent = bestStreak;
    }
    streakEl.textContent = streak;

    // Highlight the next character as the cursor position
    if (currentIndex < currentPrompt.length) {
      spans[currentIndex].className = "ks-char ks-current";
    }

    updateProgress();

    // Finished the whole prompt — load a new one
    if (currentIndex >= currentPrompt.length) {
      lastEl.textContent   = streak;
      lastWrapEl.style.display = "inline";
      setTimeout(() => loadNewPrompt(currentPrompt), 400);
    }

  } else {
    // --- Wrong keystroke ---
    flashPrompt("bad");

    // Show the last score before resetting
    lastEl.textContent       = streak;
    lastWrapEl.style.display = "inline";

    // Reset streak and restart prompt from the beginning
    streak       = 0;
    currentIndex = 0;
    streakEl.textContent = 0;
    renderPrompt();
  }
}

// Reset button — wipes everything including best streak
function handleReset() {
  bestStreak = 0;
  bestEl.textContent = 0;
  lastWrapEl.style.display = "none";
  loadNewPrompt(null);
}

// --- Init ---
resetBtn.addEventListener("click", handleReset);
window.addEventListener("keydown", handleKey);
loadNewPrompt(null);
