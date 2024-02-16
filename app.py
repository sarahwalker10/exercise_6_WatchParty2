import string
import random
from datetime import datetime
from flask import *
from functools import wraps
import sqlite3


app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/watchparty.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u

# TODO: If your app sends users to any other routes, include them here.
#       (This should not be necessary).
@app.route('/')
@app.route('/profile')
@app.route('/login')
@app.route('/signup')
@app.route('/room')
@app.route('/room/<chat_id>')
def index(chat_id=None):
    return app.send_static_file('index.html')

@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html'), 404



# -------------------------------- API ROUTES ----------------------------------

# TODO: Create the API

# @app.route('/api/signup')
# def login():
#   ...


# -------------------------------- LOGIN ----------------------------------

# GET to get the user
@app.route('/api/login', methods = ["GET"])
def login():
    #get the username
    user = request.headers.get('username')
    #get the password
    pw = request.headers.get('password')
    print(user, pw)
    query = "SELECT * FROM users WHERE name = ? and password=?"
    rows = query_db(query, [user, pw])
    if rows is None:
        error_user = [{"user_id": None, "user_api_key": None}]
        return jsonify(error_user)
    
    else:
        user = []
        for row in rows:
            row_dict = {}

            if isinstance(row["api_key"], bytes):
                user_api_key = row["api_key"].decode('utf-8')
            else:
                user_api_key = row["api_key"]

            if isinstance(row["id"], bytes):
                user_id = row["id"].decode('utf-8')
            else:
                user_id = row["id"]
        
            row_dict["user_id"] = user_id
            row_dict["user_api_key"] = user_api_key

            user.append(row_dict)
        return jsonify(user)



# -------------------------------- SIGNUP ----------------------------------

#POST a new user from signup
@app.route('/api/signup', methods = ["POST"])
def create_account():
    #get the infromation sent in the script.js request 
    user_name = request.headers.get('username')
    password = request.headers.get('password')
    verify_pw = request.headers.get('verify-pw')
    
    print(password, verify_pw)
    if password!=verify_pw:
        error_user = [{"user_id": None, "user_api_key": None}]
        return jsonify(error_user)


    else:
        api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
        db = get_db()
        cursor = db.execute("INSERT INTO users (name, password, api_key) VALUES (?, ?, ?)", [user_name, password, api_key])
        db.commit()
        cursor.close()

        #if i need their user_id, fix that here!
        new_account = [{"user_api_key": api_key}]
        return jsonify(new_account)
  



# -------------------------------- ROOM ----------------------------------
    
# GET to get all the messages in a room
@app.route('/api/room/<int:room_id>', methods = ["GET"])
def get_messages_in_room(room_id):
    query = "SELECT * FROM messages LEFT JOIN users ON \
        messages.user_id = users.id WHERE messages.room_id = ?"
    messages_rows = query_db(query, [room_id])

    list_of_messages = []
    for row in messages_rows:
        row_dict = {}

        if isinstance(row["id"], bytes):
            id = row["id"].decode('utf-8')
        else:
            id = row["id"]

        if isinstance(row["user_id"], bytes):
            user_id = row["user_id"].decode('utf-8')
        else:
            user_id = row["user_id"]

        if isinstance(row["body"], bytes):
            body = row["body"].decode('utf-8')
        else:
            body = row["body"]

        if isinstance(row["name"], bytes):
            name = row["name"].decode('utf-8')
        else:
            name = row["name"]
        
        row_dict["message_id"] = id
        row_dict["user_id"] = user_id
        row_dict["body"] = body
        row_dict["author"] = name

        list_of_messages.append(row_dict)


    return jsonify(list_of_messages)
