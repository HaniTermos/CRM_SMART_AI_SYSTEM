const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry';
  }

  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record does not exist';
  }

  const method = req.method || 'UNKNOWN';
  const url = req.originalUrl || req.url || 'unknown';
  const detailsStr = errors ? ` | Details: ${JSON.stringify(errors)}` : '';

  console.error(`❌ [BACKEND ERROR ${statusCode}] ${method} ${url} - ${message}${detailsStr}`);
  if (err.stack && process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: message,
    ...(errors && { details: errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
