from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# database config
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# -----------------
# Database model
# -----------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    password = db.Column(db.String(200))


# create database once
with app.app_context():
    db.create_all()


# -----------------
# Route
# -----------------
@app.route('/', methods=['GET', 'POST'])
def login():

    message = ""

    if request.method == 'POST':

        username = request.form['username']
        password = request.form['password']

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            message = "Login successful!"
        else:
            message = "Invalid credentials"

    return render_template("index.html", message=message)


if __name__ == "__main__":
    app.run(debug=True)
