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

## Roadmap
- Dockerfile and systemctl service start script
- Figure out mailing list stuff
- Admin panel where current officers can be modified
- Better dark mode support
- Accessibility checks
- Better backend error handling
- Blog page eventually?

## Design Choices
Given that this is intended to be continuously maintained by students
in the future, I (Ethan Richards) as the original architect would like to
explain some of my decisions with this project.

These aren't the "be all end all" choices and can be changed,
but for maintainability purposes, I think this will help.

1. PostgreSQL over MongoDB: Traditionally, Node.js projects
with ExpressJS use MongoDB. However, there is a realistic case
for a relational database given that we have users and meetings 
that are related to surveys, and hence SQL is a good idea.
Our old site ran on PostgreSQL, so we decided to use Postgre.

2. JavaScript as a backend: This was one of the hardest choices,
as I had considered Flask and other backends. I think that Node.js 
with ExpressJS is a good way to get people out of their comfort
zones and learning about web development though (and I had the
most experience in this).

3. Plain old HTML + CSS as a frontend: Even before the site
was done, I was asked why not use Angular/React or other client
side frontend frameworks. I think HTML + CSS is again better
for beginners as well and just allowed for a quicker turnaround
for the project. The good thing is that this can always be
converted into a frontend framework as desired.
