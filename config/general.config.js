const multer = require('multer');
const session = require('express-session');

/* Multer File Upload Configuration */
const multerConfig = {
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/")
    },
    filename: function (req, file, cb) {
      cb(null, req.user.avatar_id)
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
}

/* Content Security Policy Configuration */
const cspDirectives = {
    defaultSrc: ["'self'", "https://discord.com/"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
    imgSrc: ["'self'", "data:"],
};

if (process.env.NODE_ENV === "development") {
    // This prevents Safari from trying to load localhost over HTTPS.
    // See https://github.com/helmetjs/helmet/issues/429
    cspDirectives.upgradeInsecureRequests = null;
}

const cspConfig = {
    directives: cspDirectives
};

/* Cookie & Session Configuration */
const sessionConfig = {
  store: new (require('connect-pg-simple')(session))({
    conString: process.env.DB_URL,
    createTableIfMissing: true
  }),
  name: 'session',
  secret: process.env.COOKIE_SECRET || "change this!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

module.exports = {
    multerConfig: multerConfig,
    cspConfig: cspConfig,
    sessionConfig: sessionConfig
};
