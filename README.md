# acm.mines.edu

Source code for [acm.mines.edu](https://acm.mines.edu).

## Environment Setup

Clone the repository and install all dependencies with npm: `npm install`

Next, make your environment file. A sample one is provided: `cp .env.sample .env`

The `.env` file should specify Google the client ID + secret
for the OAuth2 hook, as well as a PostgreSQL database link.

Then you can run the project with docker:

```
docker compose build
docker compose up -d
```

Alternatively, you can run the project with `npm start`, but you may need to change database connections in your environment.
