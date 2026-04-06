// Adds an event listener that listener in the notes text box
// checks the spelling of the text and highlights any misspelled words in red.
document.getElementById('notes').addEventListener('input', function() {
    const text = this.value;
    const words = text.split(/\s+/);
    const misspelledWords = checkSpelling(words);
    const highlightedText = words.map(word => {
        if (misspelledWords.includes(word)) {
            return `<span style="color: red;">${word}</span>`;
        }
        return word;
    }).join(' ');
    document.getElementById('notes').innerHTML = highlightedText;
});

// A simple spell-checking function that compares each word against a predefined list of correct words.
function checkSpelling(words) {
    const dictionary = ['example', 'correct', 'spelling', 'words']; // This should be replaced with a comprehensive dictionary
    return words.filter(word => !dictionary.includes(word.toLowerCase()));
}
