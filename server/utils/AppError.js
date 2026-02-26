class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // status is 'fail' for 4xx codes (client errors), 'error' for 5xx codes (server errors)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Identifies expected/operational errors vs programming bugs

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
