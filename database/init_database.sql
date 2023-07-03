CREATE TABLE IF NOT EXISTS users (
    "email"      TEXT NOT NULL PRIMARY KEY,
    "name"       TEXT NOT NULL,
    "title"      TEXT,
    "avatar_id"  TEXT
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

CREATE TABLE IF NOT EXISTS user_projects (
    "user_id"    TEXT REFERENCES users(email),
    "project_id" TEXT REFERENCES projects(id),
    PRIMARY KEY ("user_id", "project_id")
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

CREATE TABLE IF NOT EXISTS attendance (
    "meeting" TEXT REFERENCES meetings(id),
    "email"   TEXT REFERENCES users(email),
    PRIMARY KEY ("meeting", "email")
);

CREATE TABLE IF NOT EXISTS rsvps (
    "meeting" TEXT PRIMARY KEY REFERENCES meetings(id),
    "name"    TEXT NOT NULL,
    "email"   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS images (
    "id"       TEXT PRIMARY KEY,
    "caption"  TEXT
);

CREATE TABLE IF NOT EXISTS presentations (
    "id"          TEXT PRIMARY KEY,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "date"        TIMESTAMP,
    "url"         TEXT
);
