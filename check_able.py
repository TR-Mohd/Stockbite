import sqlite3
conn = sqlite3.connect('stockbite.db')
print(conn.execute('SELECT username, role FROM users WHERE username="able"').fetchone())
