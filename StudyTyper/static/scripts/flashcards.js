document.addEventListener("DOMContentLoaded", () => {
    const savedFileSelect = document.getElementById("savedFileSelect");
    const refreshSavedFilesBtn = document.getElementById("refreshSavedFilesBtn");
    const generateFlashcardsBtn = document.getElementById("generateFlashcardsBtn");
    const flashcardsStatus = document.getElementById("flashcardsStatus");
    const selectedFileMeta = document.getElementById("selectedFileMeta");
    const sourcePreview = document.getElementById("sourcePreview");
    const flashcardsOutput = document.getElementById("flashcardsOutput");
    const deckCount = document.getElementById("deckCount");
    const studyPosition = document.getElementById("studyPosition");
    const studyCardBtn = document.getElementById("studyCardBtn");
    const studyCardFaceLabel = document.getElementById("studyCardFaceLabel");
    const studyCardPrompt = document.getElementById("studyCardPrompt");
    const studyCardContent = document.getElementById("studyCardContent");
    const prevCardBtn = document.getElementById("prevCardBtn");
    const expandCardBtn = document.getElementById("expandCardBtn");
    const nextCardBtn = document.getElementById("nextCardBtn");
    const studyOverlay = document.getElementById("studyOverlay");
    const closeOverlayBtn = document.getElementById("closeOverlayBtn");
    const overlayStudyPosition = document.getElementById("overlayStudyPosition");
    const overlayStudyCardBtn = document.getElementById("overlayStudyCardBtn");
    const overlayStudyCardFaceLabel = document.getElementById("overlayStudyCardFaceLabel");
    const overlayStudyCardPrompt = document.getElementById("overlayStudyCardPrompt");
    const overlayStudyCardContent = document.getElementById("overlayStudyCardContent");
    const overlayPrevCardBtn = document.getElementById("overlayPrevCardBtn");
    const overlayNextCardBtn = document.getElementById("overlayNextCardBtn");

    if (
        !savedFileSelect ||
        !refreshSavedFilesBtn ||
        !generateFlashcardsBtn ||
        !flashcardsStatus ||
        !selectedFileMeta ||
        !sourcePreview ||
        !flashcardsOutput ||
        !deckCount ||
        !studyPosition ||
        !studyCardBtn ||
        !studyCardFaceLabel ||
        !studyCardPrompt ||
        !studyCardContent ||
        !prevCardBtn ||
        !expandCardBtn ||
        !nextCardBtn ||
        !studyOverlay ||
        !closeOverlayBtn ||
        !overlayStudyPosition ||
        !overlayStudyCardBtn ||
        !overlayStudyCardFaceLabel ||
        !overlayStudyCardPrompt ||
        !overlayStudyCardContent ||
        !overlayPrevCardBtn ||
        !overlayNextCardBtn
    ) {
        return;
    }

    let currentFileContent = "";
    let currentFileName = "";
    let flashcards = [];
    let currentCardIndex = 0;
    let showingBack = false;
    let overlayOpen = false;

    function setStatus(text) {
        flashcardsStatus.textContent = text;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function setDeckCount(count) {
        deckCount.textContent = `${count} ${count === 1 ? "card" : "cards"}`;
    }

    function resetStudyMode(message = "Generate a deck to start studying.") {
        currentCardIndex = 0;
        showingBack = false;
        studyPosition.textContent = flashcards.length ? `Card 1 of ${flashcards.length}` : "No cards loaded";
        studyCardFaceLabel.textContent = "Front";
        studyCardPrompt.textContent = "Term";
        studyCardContent.textContent = message;
        studyCardBtn.disabled = flashcards.length === 0;
        studyCardBtn.classList.remove("is-back");
        prevCardBtn.disabled = flashcards.length === 0;
        expandCardBtn.disabled = flashcards.length === 0;
        nextCardBtn.disabled = flashcards.length === 0;
        overlayStudyPosition.textContent = flashcards.length ? `Card 1 of ${flashcards.length}` : "No cards loaded";
        overlayStudyCardFaceLabel.textContent = "Front";
        overlayStudyCardPrompt.textContent = "Term";
        overlayStudyCardContent.textContent = message;
        overlayStudyCardBtn.disabled = flashcards.length === 0;
        overlayStudyCardBtn.classList.remove("is-back");
        overlayPrevCardBtn.disabled = flashcards.length === 0;
        overlayNextCardBtn.disabled = flashcards.length === 0;
    }

    function renderPlaceholder(message) {
        flashcardsOutput.innerHTML = `<p class="flashcards-placeholder">${escapeHtml(message)}</p>`;
        setDeckCount(0);
        resetStudyMode("Your selected flashcard will appear here.");
    }

    function renderError(message) {
        flashcardsOutput.innerHTML = `<p class="flashcards-error">${escapeHtml(message)}</p>`;
        setDeckCount(0);
        resetStudyMode("Your selected flashcard will appear here.");
    }

    function renderStudyCard() {
        if (!flashcards.length) {
            resetStudyMode("Your selected flashcard will appear here.");
            return;
        }

        const card = flashcards[currentCardIndex];
        studyPosition.textContent = `Card ${currentCardIndex + 1} of ${flashcards.length}`;
        studyCardFaceLabel.textContent = showingBack ? "Back" : "Front";
        studyCardPrompt.textContent = showingBack ? "Definition" : "Term";
        studyCardContent.textContent = showingBack ? card.definition : card.term;
        studyCardBtn.disabled = false;
        studyCardBtn.classList.toggle("is-back", showingBack);
        prevCardBtn.disabled = false;
        expandCardBtn.disabled = false;
        nextCardBtn.disabled = false;

        overlayStudyPosition.textContent = `Card ${currentCardIndex + 1} of ${flashcards.length}`;
        overlayStudyCardFaceLabel.textContent = showingBack ? "Back" : "Front";
        overlayStudyCardPrompt.textContent = showingBack ? "Definition" : "Term";
        overlayStudyCardContent.textContent = showingBack ? card.definition : card.term;
        overlayStudyCardBtn.disabled = false;
        overlayStudyCardBtn.classList.toggle("is-back", showingBack);
        overlayPrevCardBtn.disabled = false;
        overlayNextCardBtn.disabled = false;
    }

    function openOverlay() {
        if (!flashcards.length) {
            return;
        }
        overlayOpen = true;
        studyOverlay.hidden = false;
        document.body.classList.add("study-overlay-open");
        renderStudyCard();
    }

    function closeOverlay() {
        overlayOpen = false;
        studyOverlay.hidden = true;
        document.body.classList.remove("study-overlay-open");
    }

    function renderFlashcards() {
        if (!flashcards.length) {
            renderPlaceholder("No flashcards were returned.");
            return;
        }

        flashcardsOutput.innerHTML = flashcards
            .map(
                (card, index) => `
                    <article class="flashcard-item" data-card-index="${index}">
                        <div class="flashcard-item-head">
                            <div class="flashcard-item-label">Card ${index + 1}</div>
                            <button type="button" class="flashcard-edit-btn secondary" data-edit-card="${index}">
                                ${card.isEditing ? "Cancel" : "Edit"}
                            </button>
                        </div>
                        ${card.isEditing ? `
                            <div class="flashcard-editor">
                                <label class="flashcard-editor-label" for="term-${index}">Term</label>
                                <input id="term-${index}" class="flashcard-editor-input" data-edit-term="${index}" value="${escapeHtml(card.draftTerm ?? card.term)}">
                                <label class="flashcard-editor-label" for="definition-${index}">Definition</label>
                                <textarea id="definition-${index}" class="flashcard-editor-textarea" data-edit-definition="${index}" rows="4" spellcheck="true">${escapeHtml(card.draftDefinition ?? card.definition)}</textarea>
                                <div class="flashcard-editor-actions">
                                    <button type="button" class="secondary" data-save-card="${index}">Save</button>
                                </div>
                            </div>
                        ` : `
                            <h3 class="flashcard-item-term">${escapeHtml(card.term || "")}</h3>
                            <p class="flashcard-item-definition">${escapeHtml(card.definition || "")}</p>
                        `}
                    </article>
                `
            )
            .join("");

        setDeckCount(flashcards.length);
        renderStudyCard();
    }

    function loadDeck(cards) {
        flashcards = (Array.isArray(cards) ? cards : []).map((card) => ({
            term: String(card.term || "").trim(),
            definition: String(card.definition || "").trim(),
            isEditing: false,
            draftTerm: "",
            draftDefinition: "",
        })).filter((card) => card.term && card.definition);

        currentCardIndex = 0;
        showingBack = false;
        renderFlashcards();
    }

    async function loadSavedFiles() {
        refreshSavedFilesBtn.disabled = true;
        setStatus("Loading saved files...");

        try {
            const res = await fetch("/api/my-files", { credentials: "same-origin" });
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                setStatus(data.error || "Could not load saved files.");
                return;
            }

            const savedFiles = Array.isArray(data.saved) ? data.saved : [];
            savedFileSelect.innerHTML = '<option value="">Choose a saved file…</option>';

            savedFiles.forEach((file) => {
                const option = document.createElement("option");
                option.value = file.name;
                option.textContent = file.name;
                savedFileSelect.appendChild(option);
            });

            if (savedFiles.length === 0) {
                setStatus("No saved server files yet. Save a note from the Notes page first.");
            } else {
                setStatus(`Loaded ${savedFiles.length} saved file${savedFiles.length === 1 ? "" : "s"}.`);
            }
        } catch (err) {
            setStatus("Could not load saved files.");
        } finally {
            refreshSavedFilesBtn.disabled = false;
        }
    }

    async function loadSelectedFile(filename) {
        currentFileContent = "";
        currentFileName = "";
        selectedFileMeta.textContent = "Loading...";
        sourcePreview.textContent = "Loading selected file...";
        renderPlaceholder("Your generated flashcards will appear here after you select a saved file.");

        try {
            const res = await fetch(`/api/my-files/content/saved/${encodeURIComponent(filename)}`, {
                credentials: "same-origin",
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                selectedFileMeta.textContent = "Could not open file";
                sourcePreview.textContent = data.error || "Could not load the selected file.";
                setStatus(data.error || "Could not open that saved file.");
                return;
            }

            currentFileName = data.name || filename;
            currentFileContent = data.content || "";
            selectedFileMeta.textContent = currentFileName;
            sourcePreview.textContent = currentFileContent || "(This file is empty.)";
            setStatus(`Loaded ${currentFileName}.`);
        } catch (err) {
            selectedFileMeta.textContent = "Could not open file";
            sourcePreview.textContent = "Could not load the selected file.";
            setStatus("Could not open that saved file.");
        }
    }

    function showCard(index) {
        if (!flashcards.length) {
            return;
        }
        const wrappedIndex = (index + flashcards.length) % flashcards.length;
        currentCardIndex = wrappedIndex;
        showingBack = false;
        renderStudyCard();
    }

    function toggleEditCard(index) {
        flashcards = flashcards.map((card, cardIndex) => {
            if (cardIndex !== index) {
                return { ...card, isEditing: false, draftTerm: "", draftDefinition: "" };
            }

            if (card.isEditing) {
                return { ...card, isEditing: false, draftTerm: "", draftDefinition: "" };
            }

            return {
                ...card,
                isEditing: true,
                draftTerm: card.term,
                draftDefinition: card.definition,
            };
        });

        renderFlashcards();
    }

    function saveEditedCard(index) {
        const card = flashcards[index];
        if (!card) {
            return;
        }

        const term = String(card.draftTerm || "").trim();
        const definition = String(card.draftDefinition || "").trim();

        if (!term || !definition) {
            setStatus("Each flashcard needs both a term and a definition.");
            return;
        }

        flashcards[index] = {
            term,
            definition,
            isEditing: false,
            draftTerm: "",
            draftDefinition: "",
        };

        renderFlashcards();
        setStatus(`Updated card ${index + 1}.`);
    }

    refreshSavedFilesBtn.addEventListener("click", loadSavedFiles);

    savedFileSelect.addEventListener("change", () => {
        const filename = savedFileSelect.value;
        if (!filename) {
            currentFileContent = "";
            currentFileName = "";
            selectedFileMeta.textContent = "No file selected";
            sourcePreview.textContent = "Choose a saved file to preview its contents here.";
            renderPlaceholder("Your generated flashcards will appear here after you select a saved file.");
            setStatus("");
            return;
        }
        loadSelectedFile(filename);
    });

    generateFlashcardsBtn.addEventListener("click", async () => {
        if (!currentFileName || !currentFileContent.trim()) {
            setStatus("Choose a saved file with note content first.");
            renderPlaceholder("Select a saved file before generating flashcards.");
            return;
        }

        generateFlashcardsBtn.disabled = true;
        setStatus(`Generating flashcards from ${currentFileName}...`);
        renderPlaceholder("Generating flashcards...");

        try {
            const res = await fetch("/api/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ content: currentFileContent }),
            });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.ok) {
                loadDeck(data.flashcards || []);
                setStatus(`Generated ${data.flashcards.length} flashcards from ${currentFileName}.`);
            } else if (res.status === 401) {
                renderError("Please log in again to generate flashcards.");
                setStatus("Not logged in. Refresh and sign in again.");
            } else {
                renderError(data.error || "Flashcard generation failed.");
                setStatus(data.error || "Flashcard generation failed.");
            }
        } catch (err) {
            renderError("Flashcard generation failed. Check that Ollama is running.");
            setStatus("Flashcard generation failed.");
        } finally {
            generateFlashcardsBtn.disabled = false;
        }
    });

    flashcardsOutput.addEventListener("click", (event) => {
        const editBtn = event.target.closest("[data-edit-card]");
        if (editBtn) {
            toggleEditCard(Number(editBtn.dataset.editCard));
            return;
        }

        const saveBtn = event.target.closest("[data-save-card]");
        if (saveBtn) {
            saveEditedCard(Number(saveBtn.dataset.saveCard));
            return;
        }

        const cardEl = event.target.closest("[data-card-index]");
        if (cardEl) {
            showCard(Number(cardEl.dataset.cardIndex));
        }
    });

    flashcardsOutput.addEventListener("input", (event) => {
        const termInput = event.target.closest("[data-edit-term]");
        if (termInput) {
            const index = Number(termInput.dataset.editTerm);
            if (flashcards[index]) {
                flashcards[index].draftTerm = termInput.value;
            }
            return;
        }

        const definitionInput = event.target.closest("[data-edit-definition]");
        if (definitionInput) {
            const index = Number(definitionInput.dataset.editDefinition);
            if (flashcards[index]) {
                flashcards[index].draftDefinition = definitionInput.value;
            }
        }
    });

    studyCardBtn.addEventListener("click", () => {
        if (!flashcards.length) {
            return;
        }
        showingBack = !showingBack;
        renderStudyCard();
    });

    expandCardBtn.addEventListener("click", () => {
        openOverlay();
    });

    prevCardBtn.addEventListener("click", () => {
        showCard(currentCardIndex - 1);
    });

    nextCardBtn.addEventListener("click", () => {
        showCard(currentCardIndex + 1);
    });

    overlayStudyCardBtn.addEventListener("click", () => {
        if (!flashcards.length) {
            return;
        }
        showingBack = !showingBack;
        renderStudyCard();
    });

    overlayPrevCardBtn.addEventListener("click", () => {
        showCard(currentCardIndex - 1);
    });

    overlayNextCardBtn.addEventListener("click", () => {
        showCard(currentCardIndex + 1);
    });

    closeOverlayBtn.addEventListener("click", () => {
        closeOverlay();
    });

    studyOverlay.addEventListener("click", (event) => {
        if (event.target.closest("[data-close-overlay='true']")) {
            closeOverlay();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && overlayOpen) {
            closeOverlay();
        }
    });

    renderPlaceholder("Your generated flashcards will appear here after you select a saved file.");
    loadSavedFiles();
});
