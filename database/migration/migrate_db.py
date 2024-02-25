# ACM Site DB Migration Script by Ethan Richards
# We're not migrating projects in this because we barely have any in the old system
import psycopg2
import uuid
import json

# open the old db (that we're migrating) and a cursor for it
old_db = psycopg2.connect("host=HOSTNAME dbname=DBNAME user=USERNAME password=PASSWORD")
old_cur = old_db.cursor()

# open the new db that we're migrating to and a cursor for it
db = psycopg2.connect("host=HOSTNAME dbname=DBNAME user=USERNAME password=PASSWORD")
cur = db.cursor()

# Migrate users from old db: https://gitlab.com/ColoradoSchoolOfMines/mozzarella/-/blob/master/mozzarella/model/auth.py?ref_type=heads
# Old columns: (user_id, user_name, display_name, created, 
# officer_title_id, officer_title, profile_pic, bio, 
# github_username, tagline, projects, profile_visibility)
# New columns: (id, name, title, avatar_id, about)
old_cur.execute("SELECT * FROM tg_user")
response = old_cur.fetchall()

for user in response:
    (user_id, user_name, display_name, created, officer_title_id, officer_title, profile_pic, bio, *other) = user
    print(f"Migrating {user_name}..")
    cur.execute("INSERT INTO users VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING", (user_name, display_name, officer_title, '', bio))

# Migrate images from old db: https://gitlab.com/ColoradoSchoolOfMines/mozzarella/-/blob/master/mozzarella/model/banner.py?ref_type=heads 
# Old columns: (id, photo, description)
# New columns: (id, caption)
old_cur.execute("SELECT * FROM banner")
response = old_cur.fetchall()

for image in response:
    (photo_id, photo, description) = image
    file_id = json.loads(photo)['file_id']

    print(f"Migrating image by ID {file_id}..")
    cur.execute("INSERT INTO images VALUES (%s, %s) ON CONFLICT DO NOTHING", (file_id, description))

# Migrate meetings from old db: https://gitlab.com/ColoradoSchoolOfMines/mozzarella/-/blob/master/mozzarella/model/meeting.py?ref_type=heads
# Old columns: (id, date, duration, location, title,
# description, survey_id, survey, more_info)
# New columns: (id, title, description, date, duration, location, type)
old_cur.execute("SELECT * FROM meeting")
response = old_cur.fetchall()

for meeting in response:
    (meeting_id, date, location, title, description, survey_id, duration, *other) = meeting # assume 1hr duration
    if title:
        print(f"Migrating meeting {title}..")
        cur.execute("INSERT INTO meetings VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING", (str(uuid.uuid4()), title, description, date, '36000000', location, ''))

# Migrate presentations from old db: https://gitlab.com/ColoradoSchoolOfMines/mozzarella/-/blob/master/mozzarella/model/presentation.py?ref_type=heads
# Old columns: (id, title, description, date, thumbnail, repo_url, other_authors)
# New columns: (id, title, description, date, url)
old_cur.execute("SELECT * FROM presentation")
response = old_cur.fetchall()
    
for presentation in response:
    (id, title, description, date, thumbnail, repo_url, other_authors) = presentation
    print(f"Migrating presentation {title}..")
    cur.execute("INSERT INTO presentations VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING", (str(uuid.uuid4()), title, description, date, repo_url))

db.commit()
print("Done!")