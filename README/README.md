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
[Figure1.png]

## Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com/).
[Figure2.png]

Run the Ollama application (Don't worry if nothing pops up, runs in background)

To make sure you have Ollama installed properly and running, run the command “ollama” in terminal
[Figure3.png]

Install proper Ollama model by typing in terminal “ollama run llama3.2:1b” (For smallest model)
[Figure4.png]
*You can start typing to chat with model. Type /bye to exit *

Run command in IDE terminal of project “pip install ollama”
(Use “brew install ollama” on macos)
[Figure5.png]

All good to run program now with Ollama AI working

```bash
ollama pull llama3.2:1b
```


## Install Python dependencies

Go to this website and download python if needed: https://www.python.org/downloads/
[Figure6.png]

### macOS

```bash
python3 -m pip install --upgrade pip
```
[Figure7.png]

```bash
python3 -m pip install -r StudyTyper/requirements.txt
```
[Figure8.png]

### Windows

```powershell
py -m pip install --upgrade pip
```
[Figure7.png]

```powershell
py -m pip install -r StudyTyper/requirements.txt
```
[Figure8.png]


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

## Troubleshooting

### Ollama Issues

**AI features (summaries/flashcards) are not working**
Ollama must be running in the background whenever you use the app. If you closed the terminal running Ollama, restart it:
```bash
ollama serve
```
Then refresh the app in your browser.

**`ollama` command not found**
- On macOS, make sure you installed via `brew install ollama` or downloaded the desktop app from ollama.com
- Try closing and reopening your terminal after installation
- On macOS, confirm Homebrew's bin is in your PATH: `echo $PATH` should include `/usr/local/bin` or `/opt/homebrew/bin`

**Model not found / generation fails**
Make sure you've pulled the model at least once:
```bash
ollama pull llama3.2:1b
```

---

### Python / pip Issues

**`python3` or `py` command not found**
Download and install Python 3.10+ from https://www.python.org/downloads/ and restart your terminal.

**pip install fails with permission errors (macOS)**
Use a virtual environment to avoid system-level permission issues:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r StudyTyper/requirements.txt
```
You'll need to activate the venv (`source venv/bin/activate`) each time you open a new terminal before running the app.

**`No module named flask` or similar import errors**
Your dependencies aren't installed, or you're in the wrong virtual environment. Re-run:
```bash
python3 -m pip install -r StudyTyper/requirements.txt
```

---

### App / Flask Issues

**`No such file or directory: StudyTyper/requirements.txt`**
You're not in the right directory. Make sure you `cd` into the project root first:
```bash
cd project201
```

**Port 5000 already in use**
Another process is using port 5000. Either kill it or run the app on a different port:
```bash
python3 StudyTyper/app.py --port 5001
```
Or find and kill the process using port 5000:
```bash
# macOS
lsof -i :5000
kill -9 <PID>
```

**App runs but the page won't load**
Make sure you're opening the correct address shown in your terminal output — usually `http://127.0.0.1:5000`. Do not use `https://`.

**Changes to files aren't reflected in the browser**
Flask runs in debug mode by default, which auto-reloads on code changes. If it's not reloading, hard-refresh your browser with `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows).

---



**Can't log in / session not persisting**
Clear your browser cookies for `127.0.0.1` and try registering a new account. The SQLite database is stored locally and resets if deleted.


## Project structure

- `StudyTyper/app.py`: main Flask app
- `StudyTyper/templates/`: HTML templates
- `StudyTyper/static/`: JavaScript, CSS, and images
- `StudyTyper/uploads/`: uploaded and saved user text files

## Notes

- The app uses SQLite locally
- Ollama must be installed and running for summaries and flashcards to work
- If Ollama is not running, the AI features will fail until the Ollama app or server is started
