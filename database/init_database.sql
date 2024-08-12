CREATE TABLE IF NOT EXISTS users (
    "id"         TEXT NOT NULL PRIMARY KEY,
    "name"       TEXT NOT NULL,
    "title"      TEXT,
    "avatar_id"  TEXT,
    "about"      TEXT
);

CREATE TABLE IF NOT EXISTS projects (
    "id"           TEXT PRIMARY KEY,
    "title"        TEXT NOT NULL,
    "description"  TEXT,
    "website"      TEXT,
    "repository"   TEXT,
    "archived"     BOOLEAN DEFAULT FALSE,
    "image_id"     TEXT
);

CREATE TABLE IF NOT EXISTS project_authors (
    "project_id"   TEXT REFERENCES projects(id),
    "author_id"    TEXT REFERENCES users(id),
    PRIMARY KEY ("project_id", "author_id")
);

CREATE TABLE IF NOT EXISTS meetings (
    "id"          TEXT PRIMARY KEY,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "date"        TIMESTAMP,
    "duration"    INTEGER,
    "location"    TEXT,
    "type"        TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
    "meeting_id" TEXT REFERENCES meetings(id),
    "user_id"    TEXT NOT NULL,
    "user_name"  TEXT NOT NULL,
    "body"       TEXT NOT NULL,
    PRIMARY KEY("meeting_id", "user_id")
);

CREATE TABLE IF NOT EXISTS attendance (
    "meeting_id"  TEXT REFERENCES meetings(id),
    "user_id"     TEXT NOT NULL,
    "user_name"   TEXT NOT NULL,
    PRIMARY KEY ("meeting_id", "user_id")
);

CREATE TABLE IF NOT EXISTS rsvps (
    "meeting_id" TEXT REFERENCES meetings(id),
    "user_id"    TEXT NOT NULL,
    "user_name"  TEXT NOT NULL,
    PRIMARY KEY ("meeting_id", "user_id")
);

CREATE TABLE IF NOT EXISTS images (
    "id"       TEXT PRIMARY KEY,
    "caption"  TEXT,
    "active"   BOOLEAN
);

CREATE TABLE IF NOT EXISTS presentations (
    "id"           TEXT PRIMARY KEY,
    "title"        TEXT NOT NULL,
    "description"  TEXT,
    "date"         DATE,
    "url"          TEXT
);
