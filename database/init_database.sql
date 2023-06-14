-- Initialize all tables with defaults

CREATE TABLE IF NOT EXISTS users (
    email      TEXT NOT NULL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    title      TEXT,
    picture_id TEXT
);

CREATE TABLE IF NOT EXISTS projects (
    id            INTEGER PRIMARY KEY,
    title         TEXT NOT NULL,
    "description" TEXT,
    website       TEXT,
    repository    TEXT,
    archived      BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_projects (
    user_id    TEXT REFERENCES users(email),
    project_id INTEGER REFERENCES projects(id),
    PRIMARY KEY (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS meetings (
    "date"        TIMESTAMP,
    duration      INTEGER,
    "location"    TEXT,
    title         TEXT NOT NULL,
    "description" TEXT,
    "type"        TEXT,
    id            INTEGER PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS attendance (
    meeting  INTEGER PRIMARY KEY REFERENCES meetings(id),
    opens    TIMESTAMP,
    closes   TIMESTAMP,
    "user"   TEXT REFERENCES users(email)
);

CREATE TABLE IF NOT EXISTS images (
    id        TEXT PRIMARY KEY,
    caption   TEXT,
    "profile" BOOLEAN
);

CREATE TABLE IF NOT EXISTS presentations (
    id            INTEGER PRIMARY KEY,
    title         TEXT NOT NULL,
    "description" TEXT,
    "date"        TIMESTAMP,
    "url"         TEXT
);
