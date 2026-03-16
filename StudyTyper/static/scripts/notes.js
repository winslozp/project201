console.log("Running");

//Notes.js - Handles the note-taking session logic, including timing, WPM calculation, and session control.
document.addEventListener("DOMContentLoaded", () => {
    const notesArea = document.getElementById("notesArea");
    const startSessionBtn = document.getElementById("startSessionBtn");
    const pauseSessionBtn = document.getElementById("pauseSessionBtn");
    const typingStatus = document.getElementById("typingStatus");
    const timeValue = document.getElementById("timeValue");
    const wpmValue = document.getElementById("wpmValue");

    if (!notesArea || !startSessionBtn || !pauseSessionBtn || !typingStatus || !timeValue || !wpmValue) {
        return;
    }

    let sessionStarted = false;
    let manuallyPaused = false;
    let activelyTyping = false;
    let activeSeconds = 0;
    let idleTimeout = null;

    // 2 seconds
    const IDLE_DELAY = 2000;
 
    // Utility function to count words in the text area
    function getWordCount(text) {
        const trimmed = text.trim();
        if (trimmed === "") return 0;
        return trimmed.split(/\s+/).length;
    }


    // Update the time and WPM display
    function updateMetrics() {
        const wordCount = getWordCount(notesArea.value);

        timeValue.textContent = `${activeSeconds}s`;

        if (activeSeconds > 0) {
            const minutes = activeSeconds / 60;
            const wpm = Math.round(wordCount / minutes);
            wpmValue.textContent = isFinite(wpm) ? wpm : 0;
        } else {
            wpmValue.textContent = "0";
        }
    }


    // Update the typing status display
    function setStatus(text) {
        typingStatus.textContent = `Status: ${text}`;
    }


    // Event listeners for session control and typing activity
    startSessionBtn.addEventListener("click", () => {
        sessionStarted = true;
        manuallyPaused = false;
        activelyTyping = false;
        setStatus("Waiting for typing...");
        notesArea.focus();
    });


    // Pause the session and stop tracking time until the user starts typing again
    pauseSessionBtn.addEventListener("click", () => {
        if (!sessionStarted) return;

        manuallyPaused = true;
        activelyTyping = false;
        clearTimeout(idleTimeout);
        setStatus("Paused");
    });


    // Detect typing activity and manage idle state
    notesArea.addEventListener("input", () => {
        if (!sessionStarted || manuallyPaused) return;

        activelyTyping = true;
        setStatus("Typing");

        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
            activelyTyping = false;
            if (!manuallyPaused && sessionStarted) {
                setStatus("Idle / Timer Paused");
            }
        }, IDLE_DELAY);

        updateMetrics();
    });

    setInterval(() => {
        if (sessionStarted && !manuallyPaused && activelyTyping) {
            activeSeconds++;
            updateMetrics();
        }
    }, 1000);
});