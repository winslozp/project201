from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
## Security Function for password hashing and verification
from werkzeug.security import generate_password_hash, check_password_hash


app = Flask(__name__)

app.config['SECRET_KEY'] = 'dev-secret-key'
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

    if request.method == 'POST': ## Post request means form submission
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()
        # check_password_hash compares the hashed password stored in the database with the password provided by the user during login. It returns True if they match, indicating a successful login, and False otherwise.

        if user and check_password_hash(user.password, password):
            message = "Login successful!"
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


if __name__ == "__main__":
    app.run(debug=True)