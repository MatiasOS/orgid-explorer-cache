const path = require('path');

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const YAML = require('yamljs');
const slash = require('express-slash');

const config = require('./config');
const { version, homepage } = require('../package.json');
const { HttpError, HttpInternalError, Http404Error, HttpInvalidRequestError } = require('./errors');
const organizations = require('./controllers/organizations');

const app = express();

// No need to leak information and waste bandwith with this header.
app.disable('x-powered-by');
app.enable('strict routing');

// Swagger docs.
const swaggerDocument = YAML.load(path.resolve(__dirname, '../docs/swagger.yaml'));
swaggerDocument.servers = [{ url: config.baseUrl }];
swaggerDocument.info.version = version;

app.use(cors());
app.use(bodyParser.json());

app.use((err, req, res, next) => {
  // Catch and handle bodyParser errors.
  if (err.statusCode === 400 && err.type === 'entity.parse.failed') {
    return next(new HttpInvalidRequestError('badRequest', 'Invalid JSON.'));
  }
  next(err);
});

// Logg HTTP requests.
app.use(morgan(':remote-addr :remote-user [:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms', {
  stream: {
    write: msg => config.logger.info(msg),
  },
}));

// Hotels
const router = express.Router({
  strict: true,
});

// Root handler
router.get('/', (req, res) => {
  res.status(200).json({
    docs: `${config.baseUrl}/docs/`,
    info: homepage,
    version,
    config: process.env.WT_CONFIG,
    environments: config.environments,
  });
});
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.get('/organizations', organizations.getList);
router.get('/organizations/:orgAddress', organizations.getDetail);

app.use(router);
app.use(slash());

// 404 handler
app.use('*', (req, res, next) => {
  next(new Http404Error());
});

// Error handler
app.use((err, req, res, next) => {
  if (!(err instanceof HttpError)) {
    config.logger.error(err.stack);
    err = new HttpInternalError();
  }
  res.status(err.status).json(err.toPlainObject());
});

module.exports = {
  app,
};
