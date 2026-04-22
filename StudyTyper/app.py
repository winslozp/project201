import os
import json
import re
from datetime import datetime

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    jsonify,
    current_app,
    send_file,
)
from flask_sqlalchemy import SQLAlchemy
## Security Function for password hashing and verification
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
## Ollama for local Ai/note summary
try:
    import ollama
except ImportError:
    ollama = None


## Basic Flask app setup, database models, and utility functions for file handling and user sessions.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)

app.config['SECRET_KEY'] = 'dev-secret-key'

## File upload configuration
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'txt'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB size


## Configure upload folder and max file size
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = (
    'sqlite:///' + os.path.join(BASE_DIR, 'users.db').replace('\\', '/')
)

# Disable SQLAlchemy event system to save resources since we don't need it
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db = SQLAlchemy(app)


# -----------------
# Database Model
# -----------------

# User moder for authenrication
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

# Note model to store user notes and metadata
class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(200), default="", nullable=False)
    content = db.Column(db.Text, default="", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# TypingSession model to track typing practice sessions and metrics
class TypingSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    note_id = db.Column(db.Integer, db.ForeignKey("note.id"), nullable=True)
    wpm = db.Column(db.Integer, nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)
    word_count = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

# Get the user based on session
def current_user():
    if "username" not in session:
        return None
    return User.query.filter_by(username=session["username"]).first()

# Handles user-specific directories for uploads and saved files
def user_upload_dir(user_id):
    p = os.path.join(current_app.config['UPLOAD_FOLDER'], 'users', str(user_id), 'uploads')
    os.makedirs(p, exist_ok=True)
    return p

# Handles directory for uploading and saving notes
def user_saved_dir(user_id):
    p = os.path.join(current_app.config['UPLOAD_FOLDER'], 'users', str(user_id), 'saved')
    os.makedirs(p, exist_ok=True)
    return p

# Define allowed folders for user files to prevent path traversal
USER_FILE_FOLDERS = frozenset({"uploads", "saved"})

# Safelt construct a file path for user files, makes sure it is a .txt file
def _safe_user_txt_path(user_id, folder_key, filename):
    fk = (folder_key or "").strip().lower()
    if fk not in USER_FILE_FOLDERS:
        return None
    name = secure_filename(filename)
    if not name or name in (".", ".."):
        return None
    if not name.lower().endswith(".txt"):
        return None
    if fk == "uploads":
        base = user_upload_dir(user_id)
    else:
        base = user_saved_dir(user_id)
    # full path must be within the user's folder to prevent path traversal
    full = os.path.normpath(os.path.join(base, name))
    abase = os.path.abspath(base)
    afull = os.path.abspath(full)
    try:
        if os.path.commonpath([afull, abase]) != abase:
            return None
    except ValueError:
        return None
    return full

# List .txt files in a directory with their names and sizes, used for displaying user files
def _list_txt_files_in_dir(directory):
    out = []
    if not os.path.isdir(directory):
        return out
    for name in sorted(os.listdir(directory)):
        if not name.lower().endswith(".txt"):
            continue
        path = os.path.join(directory, name)
        if not os.path.isfile(path):
            continue
        try:
            st = os.stat(path)
            out.append({"name": name, "size": st.st_size})
        except OSError:
            continue
    return out

# Utility function to parse optional non-negative integers from input, used for WPM
def _optional_non_negative_int(value):
    if value is None:
        return None
    try:
        n = int(value)
    except (TypeError, ValueError):
        return None
    if n < 0:
        return None
    return n

# makes sure ollama is available before using
def _ensure_ollama_available():
    if ollama is None:
        raise RuntimeError("The Python 'ollama' package is not installed.")

# Generate text using Ollama with the specified prompt and model, returns the response text.
def _generate_with_ollama(prompt, model="llama3.2:1b"):
    _ensure_ollama_available()
    client = ollama.Client()
    response = client.generate(model=model, prompt=prompt)
    text = (response.get("response") or "").strip()
    if not text:
        raise RuntimeError("Ollama returned an empty response.")
    return text

# Extract JSON payload from text, stripping code fences if present, and parse it into a Python object.
def _extract_json_payload(text):
    text = text.strip()
    # Strip code fences if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.DOTALL).strip()
    return json.loads(text)

# Make sure each card has a term and a definition 
def _normalize_flashcards(payload):
    cards = payload.get("flashcards") if isinstance(payload, dict) else payload
    if not isinstance(cards, list):
        raise ValueError("Flashcards response did not contain a flashcards list.")

    cleaned = []
    for item in cards:
        if not isinstance(item, dict):
            continue
        term = str(item.get("term", "")).strip()
        definition = str(item.get("definition", "")).strip()
        if not term or not definition:
            continue
        cleaned.append({"term": term, "definition": definition})

    if not cleaned:
        raise ValueError("No usable flashcards were returned.")

    return cleaned


with app.app_context():
    db.create_all()


# -----------------
# LOGIN
# -----------------

# The login route handles both GET and POST requests. On GET, it renders the login page. On POST, it processes the login form, checks credentials, and redirects to the notes page if successful.
@app.route('/', methods=['GET', 'POST'])
def login():

    message = ""

    if request.method == 'POST': ## Post request
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()

    # Updated so that on login user gets sent to notes page
        if user and check_password_hash(user.password, password):
            # stores the username in the session
            session['username'] = user.username
            return redirect(url_for('notes'))
        else:
            message = "Invalid credentials"

    return render_template("login.html", message=message)


# -----------------
# REGISTER
# --------
@app.route('/register', methods=['GET', 'POST'])
def register():

    message = ""

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # check if exists
        existing = User.query.filter_by(username=username).first()

        if existing:
            message = "Username already exists"
        else:
            hashed = generate_password_hash(password)
            new_user = User(username=username, password=hashed)

            db.session.add(new_user)
            db.session.commit()

            return redirect(url_for('login'))

    return render_template("register.html", message=message)


# -----------------
# NOTES PAGE
# -----------------

# The notes route checks if the user is logged in by looking for the username in the session. If not logged in, it redirects to the login page. If logged in, it renders the notes page with the username.
@app.route('/notes')
def notes():
    if 'username' not in session:
        return redirect(url_for('login'))

    return render_template("notes.html", username=session['username'])


# -----------------
# API — NOTES
# -----------------

# This API endpoint allows authenticated users to create a new note with optional typing session metrics.
# It validates the input, saves the note and metrics to the database, and returns a JSON response with the note ID.
@app.route("/api/notes", methods=["POST"])
def api_create_note():
    user = current_user()
    if not user:
        return jsonify({"ok": False, "error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    content = str(data.get("content", "")).strip()

    if not content:
        return jsonify({"ok": False, "error": "Content is required"}), 400

    note = Note(user_id=user.id, title=title, content=content)
    db.session.add(note)
    db.session.flush()

    wpm = _optional_non_negative_int(data.get("wpm"))
    duration = _optional_non_negative_int(data.get("duration_seconds"))
    word_count = _optional_non_negative_int(data.get("word_count"))

    if any(v is not None for v in (wpm, duration, word_count)):
        db.session.add(TypingSession(
            user_id=user.id,
            note_id=note.id,
            wpm=wpm,
            duration_seconds=duration,
            word_count=word_count,
        ))

    db.session.commit()
    return jsonify({"ok": True, "note_id": note.id, "message": "Note saved"}), 201

# Allows users to save a text file with their notes content
@app.route("/api/save-text-file", methods=["POST"])
def api_save_text_file():
    user = current_user()
    if not user:
        return jsonify({"ok": False, "error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    content = data.get("content", "")
    if not isinstance(content, str):
        return jsonify({"ok": False, "error": "Invalid content"}), 400

    raw_name = secure_filename((data.get("filename") or "").strip())
    if not raw_name or raw_name in (".", ".."):
        raw_name = datetime.utcnow().strftime("notes-%Y%m%d-%H%M%S.txt")
    if not raw_name.lower().endswith(".txt"):
        raw_name = secure_filename(f"{raw_name}.txt")

    save_path = os.path.join(user_saved_dir(user.id), raw_name)

    try:
        # Save the content to the file, ensuring it's written as UTF-8 text
        with open(save_path, "w", encoding="utf-8") as f:
            # Write the content to the file, replacing any characters that can't be encoded with a placeholder
            f.write(content)
    except OSError:
        return jsonify({"ok": False, "error": "Could not write file"}), 500

    return jsonify({"ok": True, "filename": raw_name, "message": "File saved to your folder"}), 201

# List the users .txt files 
@app.route("/api/my-files", methods=["GET"])
def api_my_files():
    user = current_user()
    if not user:
        return jsonify({"ok": False, "error": "Unauthorized"}), 401
    return jsonify(
        {
            "ok": True,
            "uploads": _list_txt_files_in_dir(user_upload_dir(user.id)),
            "saved": _list_txt_files_in_dir(user_saved_dir(user.id)),
        }
    )

# Get the content of a user file by filename and folder and ensure the user is authorized
# Return the content as a JSON
@app.route("/api/my-files/content/<folder>/<filename>", methods=["GET"])
def api_my_files_content(folder, filename):
    user = current_user()
    if not user:
        return jsonify({"ok": False, "error": "Unauthorized"}), 401
    path = _safe_user_txt_path(user.id, folder, filename)
    if not path or not os.path.isfile(path):
        return jsonify({"ok": False, "error": "Not found"}), 404
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    except OSError:
        return jsonify({"ok": False, "error": "Could not read file"}), 500
    return jsonify(
        {"ok": True, "content": text, "name": os.path.basename(path), "folder": folder}
    )


@app.route("/api/my-files/download/<folder>/<filename>", methods=["GET"])
def api_my_files_download(folder, filename):
    user = current_user()
    if not user:
        return jsonify({"ok": False, "error": "Unauthorized"}), 401
    path = _safe_user_txt_path(user.id, folder, filename)
    if not path or not os.path.isfile(path):
        return jsonify({"ok": False, "error": "Not found"}), 404
    return send_file(
        path,
        as_attachment=True,
        download_name=os.path.basename(path),
        mimetype="text/plain",
    )


# -----------------
# FLASHCARDS PAGE
# -----------------
@app.route('/flashcards', methods=['GET'])
def flashcards():
    if 'username' not in session:
        return redirect(url_for('login'))

    return render_template("flashcards.html", username=session['username'])


# -----------------
# GAMES PAGE
# -----------------
@app.route('/games')
def games():
    if 'username' not in session:
        return redirect(url_for('login'))

    return render_template("games.html", username=session['username'])


# -----------------
# LOGOUT
# -----------------
@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))


# -----------------
# FILE UPLOADING
# -----------------
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/upload_notes', methods=['POST'])
def upload_notes():
    if 'username' not in session:
        flash('Please log in to upload files.')
        return redirect(url_for('login'))

    user = User.query.filter_by(username=session['username']).first()
    if not user:
        session.pop('username', None)
        return redirect(url_for('login'))

    if 'notes_file' not in request.files:
        flash('No file part found.')
        return redirect(url_for('notes'))

    file = request.files['notes_file']

    if file.filename == '':
        flash('No file selected.')
        return redirect(url_for('notes'))

    if not allowed_file(file.filename):
        flash('Invalid file type. Only .txt files are allowed.')
        return redirect(url_for('notes'))

    filename = secure_filename(file.filename)
    save_dir = user_upload_dir(user.id)
    save_path = os.path.join(save_dir, filename)
    file.save(save_path)

    flash(f'File "{filename}" saved to your uploads folder.')
    return redirect(url_for('notes'))





# -----------------
# NOTE SUMMARIZING WITH LOCAL AI
# -----------------
def generate_summary_with_ollama(text):
    try:
        return _generate_with_ollama(
            prompt=f"""

            Summarize the following notes into:
            - A short paragraph summary
            - 5 bullet point key ideas

            Do not ask follow up questions
            Your only job is to generate a summary. Do not include any text not related to the summary or the notes.
            Do not add any new information to the summary that is not in the notes.

            Notes:
            {text}
            """,
        )
    except Exception as e:
        print("Ollama error:", e)
        return "Error generating summary."


def generate_flashcards_with_ollama(text):
    prompt = f"""

    Convert the notes below into 6 to 10 study flashcards.
    Focus on important concepts, vocabulary, definitions, processes, and cause/effect relationships.
    Keep each term concise and each definition to 1 or 2 sentences.
    Your only job is to generate flashcards. Do not include any text not related to the summary or the notes.
    Do not add any new information not in the notes.

    Return JSON only in this exact shape:
    {{
      "flashcards": [
        {{"term": "Term here", "definition": "Definition here"}}
      ]
    }}

    Notes:
    {text}
    """

    raw_response = _generate_with_ollama(prompt)
    payload = _extract_json_payload(raw_response)
    return _normalize_flashcards(payload)


@app.route("/api/summarize", methods=["POST"])
def api_summarize():
    user = current_user()
    if not user:
        return jsonify({"ok": False, "error": "Unauthorized"}), 401

    data = request.get_json()
    text = data.get("content", "")

    if not text.strip():
        return jsonify({"ok": False, "error": "No content provided"}), 400

    summary = generate_summary_with_ollama(text)

    return jsonify({
        "ok": True,
        "summary": summary
    })


@app.route("/api/flashcards", methods=["POST"])
def api_flashcards():
    user = current_user()
    if not user:
        return jsonify({"ok": False, "error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    text = str(data.get("content", ""))

    if not text.strip():
        return jsonify({"ok": False, "error": "No content provided"}), 400

    try:
        flashcards = generate_flashcards_with_ollama(text)
    except Exception as e:
        print("Ollama flashcard error:", e)
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "Could not generate flashcards. Make sure Ollama is installed, running, and the model is available.",
                }
            ),
            500,
        )

    return jsonify({"ok": True, "flashcards": flashcards})

## Keep at bottom
if __name__ == "__main__":
    app.run(debug=True)
