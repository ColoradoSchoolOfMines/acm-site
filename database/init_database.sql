-- Initialize all tables
CREATE TABLE IF NOT EXISTS users (
    email      TEXT NOT NULL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    is_officer BOOLEAN DEFAULT FALSE,
    title      TEXT
    picture    TEXT
);

CREATE TABLE IF NOT EXISTS meetings (
    `date`        DATETIME,
    duration      INTEGER,
    `location`    TEXT,
    title         TEXT NOT NULL,
    `description` TEXT
    id            PRIMARY KEY
    survey_id     INTEGER FOREIGN KEY
);

CREATE TABLE IF NOT EXISTS presentations (
    id            INT PRIMARY KEY,
    title         TEXT NOT NULL,
    `description` TEXT,
    `date`        DATETIME,
    `url`         TEXT
);

CREATE TABLE IF NOT EXISTS projects (
    id            INT PRIMARY KEY,
    title         TEXT NOT NULL,
    `description` TEXT,
    authors       TEXT,
    website       TEXT,
    repository    TEXT,
    archived      BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS surveys (
    id              INT PRIMARY KEY,
    meeting         FOREIGN KEY,
    opens           DATETIME,
    closes          DATETIME,
    allow_anonymous BOOLEAN DEFAULT TRUE
);
