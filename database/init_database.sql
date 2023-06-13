-- Initialize all tables
CREATE TABLE IF NOT EXISTS users (
    email      TEXT NOT NULL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    title      TEXT,
    picture    TEXT
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

CREATE TABLE IF NOT EXISTS surveys (
    id              INTEGER PRIMARY KEY,
    opens           TIMESTAMP,
    closes          TIMESTAMP,
    allow_anonymous BOOLEAN DEFAULT TRUE,
    meeting         INT REFERENCES meetings(id)
);


-- survey_responses: attendance form? table


-- CREATE TABLE IF NOT EXISTS survey_fields(

-- );

-- CREATE TABLE IF NOT EXISTS survey_responses(

--     response TEXT REFERENCES users(email)
-- );

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

CREATE TABLE IF NOT EXISTS projects (
    id            INTEGER PRIMARY KEY,
    title         TEXT NOT NULL,
    "description" TEXT,
    authors       TEXT,
    website       TEXT,
    repository    TEXT,
    archived      BOOLEAN DEFAULT FALSE
);
