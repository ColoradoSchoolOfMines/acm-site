# acm-site
The ACM site backend and frontend.

## Setup
First, clone the repository. Then, install dependencies using:
```
cd acm-site
npm install
```

Next, make your environment file. A sample one is provided.
`cp .env.sample .env`

The `.env` file should specify Google the client ID + secret
for the OAuth2 hook, as well as a PostgreSQL database link.

## Roadmap
- Dockerfile and systemctl service start script
- Figure out mailing list stuff
- Admin panel where current officers can be modified
- Better dark mode support
- Convert to TypeScript on backend?
