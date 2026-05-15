const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const swaggerUi    = require('swagger-ui-express');

const routes       = require('./routes');
const swaggerSpec  = require('./config/swagger');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// ── Security headers (CSP disabled so Swagger UI loads its inline scripts) ───
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors());

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── HTTP request logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/', routes);

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// ── OpenAPI JSON spec ─────────────────────────────────────────────────────────
app.get('/openapi.json', (req, res) => res.json(swaggerSpec));

// ── About ─────────────────────────────────────────────────────────────────────
app.get('/about', (req, res) =>
  res.json({
    name:  'Harsh Prajapati',
    email: 'chemicalliving2005@gmail.com',
    'my features': {
      'Full-Text Search':
        'Search notes by title, content, and tags using GET /notes?q=keyword. ' +
        'Powered by a MongoDB compound text index for fast, relevance-ranked results.',
      'Pagination':
        'GET /notes accepts ?page and ?limit query params. ' +
        'Total count and page metadata are returned in X-Total-Count, ' +
        'X-Total-Pages, and X-Current-Page response headers.',
      'Note Pinning':
        'Pin/unpin any owned note via PATCH /notes/:id/pin. ' +
        'Pinned notes always sort to the top in GET /notes results.',
      'Note Tags':
        'Attach an array of string tags to a note at create or update time. ' +
        'Tags are included in full-text search and returned with every note.',
    },
  })
);

// ── Root → Swagger UI redirect ────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/api-docs'));

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

// ── Centralised error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
