# project201

### Anthony Newsome, Zander Winslow, Grady Pattison, Kayden Ament, Nick McGuire

StudyTyper is a Flask app for writing notes, generating summaries with Ollama, and turning saved notes into flashcards.

## Requirements

- Python 3.10 or newer
- Git
- Ollama

## 1. Clone the project

```bash
git clone https://github.com/winslozp/project201
cd project201
```

## 2. Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com/).

After installing, make sure Ollama is running, then pull the model used by this app:

```bash
ollama pull llama3.2:1b
```

## 3. Create a virtual environment

### macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Windows PowerShell

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

### Windows Command Prompt

```bat
py -m venv .venv
.venv\Scripts\activate.bat
```

## 4. Install Python dependencies

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

## 5. Run the app locally

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

## 6. Using the app

- Register a user account or log in
- Use the Notes page to type notes, save notes, upload `.txt` files, and generate summaries
- Save a note to the server if you want to use it for flashcards
- Open the Flashcards page, choose a saved file, and generate flashcards from it
- Use Study Mode to flip cards, move between cards, edit individual cards, and open fullscreen study view

## Project structure

- `StudyTyper/app.py`: main Flask app
- `StudyTyper/templates/`: HTML templates
- `StudyTyper/static/`: JavaScript, CSS, and images
- `StudyTyper/uploads/`: uploaded and saved user text files

## Notes

- The app uses SQLite locally
- Ollama must be installed and running for summaries and flashcards to work
- If Ollama is not running, the AI features will fail until the Ollama app or server is started
