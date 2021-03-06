const express = require('express');
const app = express();
const apiRouter = require('./routes/apiRouter');
const {
  handleCustomErrors,
  handleSQLErrors,
  routeNotFound,
  handleNotFoundSqlErrors,
  handleServerErrors
} = require('./errors/index');

app.use(express.json());

app.use('/api', apiRouter);
app.use('/*', routeNotFound);
app.use(handleSQLErrors);
app.use(handleNotFoundSqlErrors);
app.use(handleCustomErrors);
app.use(handleServerErrors);

module.exports = app;
