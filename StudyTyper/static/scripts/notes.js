// Live WPM via standard formula (total chars ÷ 5 ÷ elapsed minutes); idle (2s) pauses the timer; Stop shows final average.
document.addEventListener("DOMContentLoaded", () => {
    const notesArea = document.getElementById("notesArea");
    const startSessionBtn = document.getElementById("startSessionBtn");
    const pauseSessionBtn = document.getElementById("pauseSessionBtn");
    const stopSessionBtn = document.getElementById("stopSessionBtn");
    const typingStatus = document.getElementById("typingStatus");
    const saveNotesBtn = document.getElementById("saveNotesBtn");
    const saveFileBtn = document.getElementById("saveFileBtn");
    const saveFileNameInput = document.getElementById("saveFileNameInput");
    const downloadNotesBtn = document.getElementById("downloadNotesBtn");
    const notesFileInput = document.getElementById("notesFileInput");
    const wpmDisplay = document.getElementById("wpmDisplay");
    // Generate Summary
    const generateSummaryBtn = document.getElementById("generateSummaryBtn");
    const summaryOutput = document.getElementById("summaryOutput");

    if (
        !notesArea ||
        !startSessionBtn ||
        !pauseSessionBtn ||
        !stopSessionBtn ||
        !typingStatus ||
        !saveFileBtn ||
        !saveFileNameInput ||
        !downloadNotesBtn ||
        !notesFileInput ||
        !wpmDisplay ||
        !generateSummaryBtn ||
        !summaryOutput
    ) {
        return;
    }

    let refreshMyFilesList = () => { };

    let sessionStarted = false;
    let manuallyPaused = false;
    let activelyTyping = false;
    let activeSeconds = 0;
    let idleTimeout = null;

    const IDLE_DELAY = 2000;

    function getWordCount(text) {
        const trimmed = text.trim();
        if (trimmed === "") return 0;
        return trimmed.split(/\s+/).length;
    }

    function computeWpm(charCount, seconds) {
        if (seconds <= 0) return 0;
        const minutes = seconds / 60;
        const wpm = Math.round((charCount / 5) / minutes);
        return isFinite(wpm) ? wpm : 0;
    }

    function setStatus(text) {
        typingStatus.textContent = text;
    }

    function resolveTxtFilename() {
        let name = saveFileNameInput.value.trim();
        if (!name) {
            name = "notes.txt";
        } else if (!name.toLowerCase().endsWith(".txt")) {
            name = `${name}.txt`;
        }
        return name;
    }

    function downloadTextAsFile(filename, text) {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function syncWpmDisplay() {
        if (!sessionStarted) {
            return;
        }
        wpmDisplay.textContent = String(computeWpm(notesArea.value.length, activeSeconds));
    }

    // Event Listeners
    startSessionBtn.addEventListener("click", () => {
        activeSeconds = 0;
        sessionStarted = true;
        manuallyPaused = false;
        activelyTyping = false;
        pauseSessionBtn.textContent = "Pause";
        clearTimeout(idleTimeout);
        setStatus("Session started — type to begin");
        wpmDisplay.textContent = "0";
        notesArea.focus();
    });


    // Toggle pause/resume on button click; also pause on idle (2s no typing) and resume on input.
    pauseSessionBtn.addEventListener("click", () => {
        if (!sessionStarted) return;

        manuallyPaused = !manuallyPaused;
        if (manuallyPaused) {
            activelyTyping = false;
            clearTimeout(idleTimeout);
            pauseSessionBtn.textContent = "Resume";
            setStatus("Paused");
            syncWpmDisplay();
        } else {
            pauseSessionBtn.textContent = "Pause";
            setStatus("Resumed — type to continue");
        }
    });

    // Stop session, show final WPM, and reset all timers/status.
    stopSessionBtn.addEventListener("click", () => {
        if (!sessionStarted) return;

        const wc = getWordCount(notesArea.value);
        const finalWpm = computeWpm(notesArea.value.length, activeSeconds);

        sessionStarted = false;
        manuallyPaused = false;
        activelyTyping = false;
        clearTimeout(idleTimeout);
        pauseSessionBtn.textContent = "Pause";

        wpmDisplay.textContent = String(finalWpm);
        setStatus(`Session stopped — average ${finalWpm} WPM (${activeSeconds}s active)`);
    });


    // On input, if session is active and not manually paused, mark as actively typing and reset idle timer; on idle, mark as not actively typing and pause timer.
    notesArea.addEventListener("input", () => {
        if (!sessionStarted || manuallyPaused) return;

        activelyTyping = true;
        setStatus("Typing");

        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
            activelyTyping = false;
            if (!manuallyPaused && sessionStarted) {
                setStatus("Idle — timer paused");
            }
            syncWpmDisplay();
        }, IDLE_DELAY);

        syncWpmDisplay();
    });

    setInterval(() => {
        if (sessionStarted && !manuallyPaused && activelyTyping) {
            activeSeconds++;
            syncWpmDisplay();
        }
    }, 1000);


    // Save note to server with title (first line or truncated), content, word count, duration, and computed WPM; handle UI states and errors.
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener("click", async () => {
            const content = notesArea.value;
            if (!content.trim()) {
                setStatus("Nothing to save — add some notes first.");
                return;
            }

            const firstLine = content.trim().split("\n")[0];
            const title = firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;

            const wc = getWordCount(content);
            const payload = {
                title,
                content,
                wpm: computeWpm(content.length, activeSeconds),
                duration_seconds: activeSeconds,
                word_count: wc,
            };

            saveNotesBtn.disabled = true;
            setStatus("Saving...");

            try {
                const res = await fetch("/api/notes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify(payload),
                });
                const data = await res.json().catch(() => ({}));

                if (res.ok && data.ok) {
                    setStatus(`Saved (note #${data.note_id})`);
                } else if (res.status === 401) {
                    setStatus("Not logged in — refresh and sign in again.");
                } else {
                    setStatus(data.error || "Save failed.");
                }
            } catch (e) {
                setStatus("Save failed — check your connection.");
            } finally {
                saveNotesBtn.disabled = false;
            }
        });
    }
    // Save note as .txt file on server with optional filename; handle UI states and errors.
    saveFileBtn.addEventListener("click", async () => {
        const content = notesArea.value;
        let filename = saveFileNameInput.value.trim();
        if (filename && !filename.toLowerCase().endsWith(".txt")) {
            filename = `${filename}.txt`;
        }

        saveFileBtn.disabled = true;
        setStatus("Saving to server…");

        try {
            const res = await fetch("/api/save-text-file", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ content, filename: filename || undefined }),
            });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.ok) {
                setStatus(`Saved on server: ${data.filename}`);
            } else if (res.status === 401) {
                setStatus("Not logged in — refresh and sign in again.");
            } else {
                setStatus(data.error || "Could not save file.");
            }
        } catch (e) {
            setStatus("Save to server failed — check your connection.");
        } finally {
            saveFileBtn.disabled = false;
        }
    });

    // A comment

    // Download note as .txt file to device with optional filename; handle UI states and errors.
    downloadNotesBtn.addEventListener("click", () => {
        const filename = resolveTxtFilename();
        downloadTextAsFile(filename, notesArea.value);
        setStatus(`Downloaded “${filename}” to your device`);
    });

    // Summary Button
    generateSummaryBtn.addEventListener("click", async () => {
        const content = notesArea.value;

        if (!content.trim()) {
            setStatus(" Nothing to summarize — add some notes first.");
            summaryOutput.value = "";
            return;
        }

        generateSummaryBtn.disabled = true;
        summaryOutput.value = "Generating summary...";
        setStatus(" Generating summary...");

        try {
            const res = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ content }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.ok) {
                summaryOutput.value = data.summary || "";
                setStatus(" Summary generated.");
            } else if (res.status === 401) {
                summaryOutput.value = "";
                setStatus("Not logged in — refresh and sign in again.");
            } else {
                summaryOutput.value = "";
                setStatus(data.error || "Summary failed.");
            }
        } catch (e) {
            summaryOutput.value = "";
            setStatus("Summary failed — check your connection.");
        } finally {
            generateSummaryBtn.disabled = false;
        }
    });

    // Load .txt file from device into editor, replacing current content; handle UI states and errors.
    notesFileInput.addEventListener("change", () => {
        const file = notesFileInput.files && notesFileInput.files[0];
        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".txt")) {
            setStatus("Only .txt files can be loaded into the editor.");
            notesFileInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === "string" ? reader.result : "";
            const existing = notesArea.value.trim();
            if (existing) {
                if (!window.confirm("Replace current notes with this file?")) {
                    notesFileInput.value = "";
                    return;
                }
            }
            notesArea.value = text;
            setStatus(`Loaded “${file.name}” — keep editing, then Save to server / Download.`);
            notesFileInput.value = "";
        };
        reader.onerror = () => {
            setStatus("Could not read that file.");
            notesFileInput.value = "";
        };
        reader.readAsText(file);
    });

    const myFilesContainer = document.getElementById("myFilesContainer");
    const myFilesRefreshBtn = document.getElementById("myFilesRefreshBtn");
    if (myFilesContainer && myFilesRefreshBtn) {
        function formatBytes(n) {
            if (n < 1024) {
                return `${n} B`;
            }
            if (n < 1024 * 1024) {
                return `${(n / 1024).toFixed(1)} KB`;
            }
            return `${(n / (1024 * 1024)).toFixed(1)} MB`;
        }

        function contentUrl(folder, name) {
            return `/api/my-files/content/${encodeURIComponent(folder)}/${encodeURIComponent(name)}`;
        }

        function downloadUrl(folder, name) {
            return `/api/my-files/download/${encodeURIComponent(folder)}/${encodeURIComponent(name)}`;
        }

        async function loadMyFiles() {
            myFilesContainer.innerHTML = '<p class="my-files-loading">Loading…</p>';
            try {
                const res = await fetch("/api/my-files", { credentials: "same-origin" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) {
                    myFilesContainer.innerHTML =
                        '<p class="my-files-error">Could not load your file list.</p>';
                    return;
                }
                myFilesContainer.innerHTML = "";
                const sv = data.saved || [];
                if (!sv.length) {
                    myFilesContainer.innerHTML =
                        '<p class="my-files-empty">No .txt files saved yet.</p>';
                    return;
                }

                function renderGroup(title, items, folderKey) {
                    if (!items.length) {
                        return;
                    }
                    const h = document.createElement("h3");
                    h.className = "my-files-group-title";
                    h.textContent = title;
                    myFilesContainer.appendChild(h);
                    const ul = document.createElement("ul");
                    ul.className = "my-files-list";
                    items.forEach((item) => {
                        const li = document.createElement("li");
                        li.className = "my-files-item";
                        const meta = document.createElement("span");
                        meta.className = "my-files-meta";
                        meta.textContent = `${item.name} · ${formatBytes(item.size)}`;
                        const openBtn = document.createElement("button");
                        openBtn.type = "button";
                        openBtn.className = "secondary";
                        openBtn.textContent = "Open";
                        openBtn.dataset.folder = folderKey;
                        openBtn.dataset.file = item.name;
                        const a = document.createElement("a");
                        a.href = downloadUrl(folderKey, item.name);
                        a.className = "my-file-dl";
                        a.textContent = "Download";
                        a.setAttribute("download", "");
                        li.appendChild(meta);
                        li.appendChild(openBtn);
                        li.appendChild(a);
                        ul.appendChild(li);
                    });
                    myFilesContainer.appendChild(ul);
                }

                renderGroup("Saved (Save to server)", sv, "saved");
            } catch (e) {
                myFilesContainer.innerHTML =
                    '<p class="my-files-error">Could not load your file list.</p>';
            }
        }

        myFilesContainer.addEventListener("click", async (e) => {
            const btn = e.target.closest("button[data-folder][data-file]");
            if (!btn) {
                return;
            }
            const folder = btn.dataset.folder;
            const name = btn.dataset.file;
            if (!folder || !name) {
                return;
            }
            const existing = notesArea.value.trim();
            if (existing) {
                if (!window.confirm("Replace current notes with this file?")) {
                    return;
                }
            }
            try {
                const res = await fetch(contentUrl(folder, name), { credentials: "same-origin" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) {
                    setStatus("Could not open that file.");
                    return;
                }
                notesArea.value = data.content;
                setStatus(`Opened “${data.name}” from ${folder}.`);
            } catch (err) {
                setStatus("Could not open that file.");
            }
        });

        myFilesRefreshBtn.addEventListener("click", loadMyFiles);
        refreshMyFilesList = loadMyFiles;
        loadMyFiles();
    }
});

notesArea.addEventListener("paste", (e) => {
    e.preventDefault();
    setStatus("Pasting is disabled.");
});