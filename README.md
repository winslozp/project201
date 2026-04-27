# project201

### Anthony Newsome, Zander Winslow, Grady Pattison, Kayden Ament, Nick McGuire
---                                                                                                                               
  StudyTyper                                                                                                                      
                                                                                                                                    
  StudyTyper is a web-based study productivity application that combines note-taking, typing practice, and AI-powered flashcard   
  generation to help students study more effectively. It runs entirely locally using Flask and Ollama (a local LLM), so no data is
  sent to external services.

  ---
  Tech Stack

  - Backend: Python, Flask, Flask-SQLAlchemy, SQLite, Ollama (local AI)
  - Frontend: HTML5, CSS3, Vanilla JavaScript (no framework)
  - Security: Werkzeug password hashing, path traversal prevention, session-based auth

  ---
  Features

  User Authentication

  - Register and log in with a username and password
  - Passwords are securely hashed; sessions persist across pages

  Notes

  - Write and edit notes in a built-in text editor
  - Import .txt files from your device
  - Save notes to the server or download them directly
  - View and manage all your saved files
  - Live WPM tracker — measures your typing speed in real time with idle detection and session controls (start/pause/stop)
  - AI Summary — generates a short paragraph summary plus 5 key bullet points from your notes using a local LLM

  Flashcards

  - Select any saved .txt file and generate 6–10 AI-powered flashcards (term/definition pairs)
  - Flip cards, navigate through the deck, and study inline or in fullscreen mode
  - Edit individual cards directly in the browser

  Typing Game (Keystroke Streak)

  - A typing accuracy game with 20 rotating prompts
  - One wrong keystroke ends the game
  - Tracks score, elapsed time, and points-per-second
  - Visual progress bar showing completion percentage

  ---


## Requirements

- Python 3.10 or newer
- Git
- Ollama

## Clone the project

```bash
git clone https://github.com/winslozp/project201
cd project201
```

## 2. Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com/).

Run the Ollama application (Don't worry if nothing pops up, runs in background)

To make sure you have Ollama installed properly and running, run the command “ollama” in terminal

Install proper Ollama model by typing in terminal “ollama run llama3.2:1b” (For smallest model)

*You can start typing to chat with model. Type /bye to exit *

Run command in IDE terminal of project “pip install ollama”
(Use “brew install ollama” on macos)

All good to run program now with Ollama AI working

```bash
ollama pull llama3.2:1b
```

## Install Python dependencies

Go to this website and download python if needed: https://www.python.org/downloads/

### macOS

```bash
python3 -m pip install --upgrade pip
python3 -m pip install -r StudyTyper/requirements.txt
```

### Windows

```powershell
py -m pip install --upgrade pip
py -m pip install -r StudyTyper/requirements.txt
```

## Run the app locally

### macOS

```bash
python3 StudyTyper/app.py
```

### Windows

```powershell
py StudyTyper/app.py
```

The app will start in Flask debug mode. Open the local address shown in the terminal, usually:

```text
http://127.0.0.1:5000
```


## Project structure

- `StudyTyper/app.py`: main Flask app
- `StudyTyper/templates/`: HTML templates
- `StudyTyper/static/`: JavaScript, CSS, and images
- `StudyTyper/uploads/`: uploaded and saved user text files

## Notes

- The app uses SQLite locally
- Ollama must be installed and running for summaries and flashcards to work
- If Ollama is not running, the AI features will fail until the Ollama app or server is started
