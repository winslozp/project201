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
let currentIndex  = 0;
let totalScore    = 0;
let startTime     = null;
let timerInterval = null;

// --- DOM references ---
const promptEl     = document.getElementById("ks-prompt");
const scoreEl      = document.getElementById("ks-score");
const timerEl      = document.getElementById("ks-timer");
const progressBar  = document.getElementById("ks-progress-bar");
const resetBtn     = document.getElementById("ks-reset-btn");
const gameOverEl   = document.getElementById("ks-game-over");
const goScoreEl    = document.getElementById("ks-go-score");
const goTimeEl     = document.getElementById("ks-go-time");
const goFinalEl    = document.getElementById("ks-go-final");
const playAgainBtn = document.getElementById("ks-go-play-again");

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

// Start the elapsed-time timer
function startTimer() {
  if (timerInterval) return;
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timerEl.textContent = elapsed.toFixed(1) + "s";
  }, 100);
}

// Stop and return elapsed seconds
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  return startTime ? (Date.now() - startTime) / 1000 : 0;
}

function loadNewPrompt(exclude) {
  currentPrompt = getRandomPrompt(exclude);
  currentIndex  = 0;
  renderPrompt();
}

// Flash the prompt box briefly (green for correct, red for wrong)
function flashPrompt(type) {
  promptEl.classList.add(type === "good" ? "ks-flash-good" : "ks-flash-bad");
  setTimeout(() => promptEl.classList.remove("ks-flash-good", "ks-flash-bad"), 250);
}

// Show the game-over overlay with final stats
function showGameOver() {
  const elapsed = stopTimer();
  const final   = (totalScore / elapsed);

  goScoreEl.textContent = totalScore;
  goTimeEl.textContent  = elapsed.toFixed(1) + "s";
  goFinalEl.textContent = final.toFixed(2);

  promptEl.style.display      = "none";
  gameOverEl.style.display    = "flex";
}

// Hide the game-over overlay and start fresh
function hideGameOver() {
  promptEl.style.display   = "";
  gameOverEl.style.display = "none";
}

// Called on every keypress
function handleKey(e) {
  // Ignore modifier keys and keys that aren't a single printable character
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  // Ignore input while game-over is showing
  if (gameOverEl.style.display !== "none") return;

  // Start the timer on the very first keystroke
  if (!timerInterval && !startTime) startTimer();

  const expected = currentPrompt[currentIndex];

  if (e.key === expected) {
    // --- Correct keystroke ---
    flashPrompt("good");

    // Mark this character green
    const spans = promptEl.querySelectorAll(".ks-char");
    spans[currentIndex].className = "ks-char ks-done";

    currentIndex++;
    totalScore++;
    scoreEl.textContent = totalScore;

    // Highlight the next character as the cursor position
    if (currentIndex < currentPrompt.length) {
      spans[currentIndex].className = "ks-char ks-current";
    }

    updateProgress();

    if (currentIndex >= currentPrompt.length) {
      setTimeout(() => loadNewPrompt(currentPrompt), 400);
    }

  } else {
    // --- Wrong keystroke — game over ---
    flashPrompt("bad");
    showGameOver();
  }
}

// Full reset — wipes everything
function fullReset() {
  stopTimer();
  startTime  = null;
  totalScore = 0;
  bestStreak = 0;

  scoreEl.textContent = 0;
  timerEl.textContent = "0.0s";

  hideGameOver();
  loadNewPrompt(null);
}

// --- Init ---
resetBtn.addEventListener("click", fullReset);
playAgainBtn.addEventListener("click", fullReset);
window.addEventListener("keydown", handleKey);
loadNewPrompt(null);
