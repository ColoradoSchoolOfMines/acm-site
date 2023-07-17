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
    "author_email" TEXT REFERENCES users(id),
    PRIMARY KEY ("project_id", "author_email")
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
    "email"    TEXT PRIMARY KEY REFERENCES users(id),
    "feedback" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
    "meeting" TEXT REFERENCES meetings(id),
    "email"   TEXT NOT NULL,
    "name"    TEXT NOT NULL,
    PRIMARY KEY ("meeting", "email")
);

CREATE TABLE IF NOT EXISTS rsvps (
    "meeting" TEXT REFERENCES meetings(id),
    "email"   TEXT NOT NULL,
    "name"    TEXT NOT NULL,
    PRIMARY KEY ("meeting", "email")
);

CREATE TABLE IF NOT EXISTS images (
    "id"       TEXT PRIMARY KEY,
    "caption"  TEXT
);

CREATE TABLE IF NOT EXISTS presentations (
    "id"          TEXT PRIMARY KEY,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "date"        DATE,
    "url"         TEXT
);
