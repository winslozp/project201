import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
## Security Function for password hashing and verification
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename


app = Flask(__name__)

app.config['SECRET_KEY'] = 'dev-secret-key'

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# -----------------
# Database Model
# -----------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


with app.app_context():
    db.create_all()


# -----------------
# LOGIN
# -----------------
@app.route('/', methods=['GET', 'POST'])
def login():

    message = ""

    if request.method == 'POST': ## Post request
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()

    # Updated so that on login user gets sent to notes page
        if user and check_password_hash(user.password, password):
            session['username'] = user.username
            # ^ This line stores the user
            return redirect(url_for('notes'))
        else:
            message = "Invalid credentials"

    return render_template("login.html", message=message)


# -----------------
# REGISTER
# -----------------
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
@app.route('/notes')
def notes():
    if 'username' not in session:
        return redirect(url_for('login'))

    return render_template("notes.html", username=session['username'])


# -----------------
# FLASHCARDS PAGE
# -----------------
@app.route('/flashcards', methods=['GET', 'POST'])
def flashcards():
    if 'username' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        term = request.form.get('term')
        definition = request.form.get('definition')

        # For now this just prints to terminal
        # Implement saving flashcards in db later
        print("Flashcard added:", term, definition)

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
    if 'notes_file' not in request.files:
        flash('No file part found.')
        return redirect(url_for('notes'))

    file = request.files['notes_file']

    if file.filename == '':
        flash('No file selected.')
        return redirect(url_for('notes'))

    if not allowed_file(file.filename):
        flash('Invalid file type. Only PDF and TXT files are allowed.')
        return redirect(url_for('notes'))

    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)

    flash(f'File "{filename}" uploaded successfully.')
    return redirect(url_for('notes'))





if __name__ == "__main__":
    app.run(debug=True)