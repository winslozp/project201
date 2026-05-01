// Handles the flashcard generation, display, and study mode interactions on the Flashcards page.
// This script manages the UI elements, user interactions, and communication with the server to load saved files and generate flashcards based on note content.
//  It also provides an interface for studying the generated flashcards with a front/back toggle and an expanded view overlay.
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

    // Check that all the necessary elements are present in the DOM before proceeding. 
    // If any are missing, we won't be able to function properly, so we return early.
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

    // --- State variables ---
    let currentFileContent = "";
    let currentFileName = "";
    let flashcards = [];
    let currentCardIndex = 0;
    let showingBack = false;
    let overlayOpen = false;

    // Updates the flashcards status message shown in the UI.
    function setStatus(text) {
        flashcardsStatus.textContent = text;
    }

    // Escapes user-provided text before inserting it into HTML.
    // This helps prevent XSS vulnerabilities if the flashcard content includes special characters.
    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    // Shows how many flashcards are currently loaded in the deck.
    function setDeckCount(count) {
        let label;

        if (count === 1) {
            label = "card";
        } else {
            label = "cards";
        }

        deckCount.textContent = `${count} ${label}`;
    }

    // Resets the study view to its default state and message.
    // This is used when loading a new deck, when there are no flashcards, or when an error occurs.
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

    // Displays a placeholder message when no flashcards are available
    function renderPlaceholder(message) {
        flashcardsOutput.innerHTML = `<p class="flashcards-placeholder">${escapeHtml(message)}</p>`;
        setDeckCount(0);
        resetStudyMode("Your selected flashcard will appear here.");
    }

    // Displays an error message in the flashcards output area.
    function renderError(message) {
        flashcardsOutput.innerHTML = `<p class="flashcards-error">${escapeHtml(message)}</p>`;
        setDeckCount(0);
        resetStudyMode("Your selected flashcard will appear here.");
    }

    // Refreshes the main and overlay study cards to match the current card state.
    function renderStudyCard() {
        if (!flashcards.length) {
            resetStudyMode("Your selected flashcard will appear here.");
            return;
        }
        // Get the current card and update the study view with its term or definition based on whether we're showing the front or back.
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

        // Sync the overlay study card with the same content and state.
        overlayStudyPosition.textContent = `Card ${currentCardIndex + 1} of ${flashcards.length}`;
        overlayStudyCardFaceLabel.textContent = showingBack ? "Back" : "Front";
        overlayStudyCardPrompt.textContent = showingBack ? "Definition" : "Term";
        overlayStudyCardContent.textContent = showingBack ? card.definition : card.term;
        overlayStudyCardBtn.disabled = false;
        overlayStudyCardBtn.classList.toggle("is-back", showingBack);
        overlayPrevCardBtn.disabled = false;
        overlayNextCardBtn.disabled = false;
    }

    // Opens the expanded study overlay for the current flashcard.
    function openOverlay() {
        if (!flashcards.length) {
            return;
        }
        overlayOpen = true;
        studyOverlay.hidden = false;
        document.body.classList.add("study-overlay-open");
        renderStudyCard();
    }

    // Closes the expanded study overlay and returns to the page view.
    function closeOverlay() {
        overlayOpen = false;
        studyOverlay.hidden = true;
        document.body.classList.remove("study-overlay-open");
    }

    // Renders the full flashcard list and syncs the study view.
    function renderFlashcards() {
        if (!flashcards.length) {
            renderPlaceholder("No flashcards were returned.");
            return;
        }
        // Render each flashcard as an article with its term and definition, along with an edit button to toggle edit mode for that card.
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

    // Normalizes generated cards and loads them into the current deck.
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

    // Fetches the user's saved files and fills the file picker options.
    async function loadSavedFiles() {
        refreshSavedFilesBtn.disabled = true;
        setStatus("Loading saved files...");

        // Fetch the list of saved files from the server and populate the dropdown select with those options.
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
                setStatus("");
            }
        } catch (err) {
            setStatus("Could not load saved files.");
        } finally {
            refreshSavedFilesBtn.disabled = false;
        }
    }

    // Loads the selected saved file and shows its contents in the preview.
    async function loadSelectedFile(filename) {
        currentFileContent = "";
        currentFileName = "";
        selectedFileMeta.textContent = "Loading...";
        sourcePreview.textContent = "Loading selected file...";
        renderPlaceholder("Your generated flashcards will appear here after you select a saved file.");

        try {
            // Fetch the file content from the server for the selected filename.
            const res = await fetch(`/api/my-files/content/saved/${encodeURIComponent(filename)}`, {
                credentials: "same-origin",
            });
            const data = await res.json().catch(() => ({}));
            // If the response is not OK or doesn't have the expected structure, show an error message.
            if (!res.ok || !data.ok) {
                selectedFileMeta.textContent = "Could not open file";
                sourcePreview.textContent = data.error || "Could not load the selected file.";
                setStatus(data.error || "Could not open that saved file.");
                return;
            }
            // If the file content is successfully loaded, update the current file variables and show the content in the preview area.
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

    // Switches the study view to a specific flashcard by index.
    function showCard(index) {
        if (!flashcards.length) {
            return;
        }
        const wrappedIndex = (index + flashcards.length) % flashcards.length;
        currentCardIndex = wrappedIndex;
        showingBack = false;
        renderStudyCard();
    }

    // Toggles edit mode for one flashcard and closes editors on the others.
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

    // Saves the edited term and definition for a flashcard.
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

    // When the user selects a different file from the dropdown
    //  load that file's content for preview and flashcard generation.
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

    // When the user clicks the button to generate flashcards from the selected file's content
    generateFlashcardsBtn.addEventListener("click", async () => {
        if (!currentFileName || !currentFileContent.trim()) {
            setStatus("Choose a saved file with note content first.");
            renderPlaceholder("Select a saved file before generating flashcards.");
            return;
        }

        // Disable the button to prevent multiple clicks and show a status message while generating flashcards.
        generateFlashcardsBtn.disabled = true;
        setStatus(`Generating flashcards from ${currentFileName}...`);
        renderPlaceholder("Generating flashcards...");

        // Send the file content to the server to generate flashcards using the Ollama model.
        try {
            const res = await fetch("/api/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ content: currentFileContent }),
            });
            const data = await res.json().catch(() => ({}));
            // If the response is successful and contains flashcards
            // load them into the deck and update the status. 
            // Otherwise, show an error message based on the response.
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


    // Handle clicks on flashcard items for editing and studying, as well as input events for editing flashcard content.
    flashcardsOutput.addEventListener("click", (event) => {
        const editBtn = event.target.closest("[data-edit-card]");
        if (editBtn) {
            toggleEditCard(Number(editBtn.dataset.editCard));
            return;
        }

        // If the click was on a save button within an editor, save the changes for that card.
        const saveBtn = event.target.closest("[data-save-card]");
        if (saveBtn) {
            saveEditedCard(Number(saveBtn.dataset.saveCard));
            return;
        }

        // If the click was on a flashcard item (but not on an edit or save button), show that card in the study view.
        const cardEl = event.target.closest("[data-card-index]");
        if (cardEl) {
            showCard(Number(cardEl.dataset.cardIndex));
        }
    });

    // Handle input events on the flashcard editor fields to update the draft term and definition for the card being edited.
    flashcardsOutput.addEventListener("input", (event) => {
        const termInput = event.target.closest("[data-edit-term]");
        if (termInput) {
            const index = Number(termInput.dataset.editTerm);
            if (flashcards[index]) {
                flashcards[index].draftTerm = termInput.value;
            }
            return;
        }

        // If the input event was on a definition field, update the draft definition for that card.
        const definitionInput = event.target.closest("[data-edit-definition]");
        if (definitionInput) {
            const index = Number(definitionInput.dataset.editDefinition);
            if (flashcards[index]) {
                flashcards[index].draftDefinition = definitionInput.value;
            }
        }
    });

    // Handle clicks on the study card buttons to flip the card and navigate between cards, 
    // as well as opening and closing the expanded study overlay.
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
