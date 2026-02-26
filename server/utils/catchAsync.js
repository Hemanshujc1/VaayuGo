/**
 * Wraps an async express route handler to automatically catch any rejected promises
 * and pass them to the Express error handling middleware via next(err).
 * 
 * This eliminates the need for repetitive try/catch blocks in standard controllers.
 * 
 * @param {Function} fn The controller async function
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };
  
  module.exports = catchAsync;
  
