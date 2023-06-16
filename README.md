# acm.mines.edu
Source code for the acm.mines.edu website.

## Setup
Once the repository is cloned, install all dependencies using npm:
```
cd acm-site
npm install
```

Next, make your environment file. A sample one is provided: `cp .env.sample .env`

The `.env` file should specify Google the client ID + secret
for the OAuth2 hook, as well as a PostgreSQL database link.

Finally, initialize the session tables: `psql mydb < node_modules/connect-pg-simple/table.sql`

## Docker Setup (Experimental)
Alternatively, you can follow these steps to run with Docker.

First, ensure the `HOST` in the `DB_URL` in `.env` is set to `db`, instead of `localhost`.

Then, navigate to the server directory and run the following commands.
```
docker compose build
docker compose up -d
```

TODO: write script for initializing the session tables

## Roadmap
- Figure out mailing list subscribe
- Admin panel where current officers can be modified
- Better dark mode support
- Frontend accessibility checks
- Better backend error handling
- Blog page

## Design Choices
Given that this is intended to be continuously maintained by students
in the future, I (Ethan Richards) as the original architect would like to
explain some of my decisions with this project. These aren't the "be all end all" 
choices and can be changed, but for maintainability purposes, I think this will help.

1. **PostgreSQL over MongoDB**: Traditionally, Node.js projects
with ExpressJS use MongoDB. However, there is a realistic case
for a relational database given that we have users and meetings 
that are related to surveys, and hence SQL is a good idea.
Our old site ran on PostgreSQL, so we decided to use Postgres.

2. **JavaScript as a backend**: This was one of the hardest choices,
as I had considered Flask and other frameworks. However, I think that 
Node.js with ExpressJS is a good way to get people out of their comfort
zones and learning about web development (and I had the
most experience in this, for timeframe purposes).

3. **Plain old HTML and CSS on the frontend**: Even before the site
was done, I was asked why not use Angular/React or other client
side frontend frameworks. I think HTML + CSS is again better
for beginners as well and just allowed for a quicker turnaround
for the project. The good thing is that this can always be
converted into a frontend framework as desired.

4. **Google OAuth2 Authentication**: Originally we had considered
linking in with Mines's SSO/SAML auth systems (Okta or Shibboleth), 
but acquiring a certificate for these could take a long time. For
now, we're simply hooking into mines@edu Google accounts, since all
students are provided with one.
