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

Finally, initialize the session tables: `psql mydatabase < node_modules/connect-pg-simple/table.sql`

## Roadmap
- Dockerfile and systemctl service start script
- Figure out mailing list stuff
- Admin panel where current officers can be modified
- Better dark mode support
- Accessibility checks
- Better backend error handling
