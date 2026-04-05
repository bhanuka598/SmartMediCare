/**
 * Retry utility with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error is retryable
 * @returns {Promise<any>} - Result of the function
 */
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if this error should be retried
      if (!shouldRetry(error)) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms. Error: ${error.message}`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Determine if a database error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retryable
 */
function isRetryableDBError(error) {
  // MongoDB retryable errors
  const retryableCodes = [
    11600, // InterruptedAtShutdown
    11602, // InterruptedDueToReplStateChange
    10107, // NotMaster
    13435, // NotMasterNoSlaveOk
    13436, // NotMasterOrSecondary
    189,   // PrimarySteppedDown
    91,    // ShutdownInProgress
    7,     // HostNotFound
    6,     // HostUnreachable
    89,    // NetworkTimeout
    9001,  // SocketException
    262,   // ExceededTimeLimit
  ];

  // Check for network-related error messages
  const retryableMessages = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EPIPE',
    'ENOTFOUND',
    'socket timeout',
    'connection timeout',
    'network error',
    'topology was destroyed'
  ];

  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  const errorMessage = error.message?.toLowerCase() || '';
  return retryableMessages.some(msg => 
    errorMessage.includes(msg.toLowerCase())
  );
}

/**
 * Determine if an email error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retryable
 */
function isRetryableEmailError(error) {
  const retryableMessages = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EPIPE',
    'timeout',
    'connection lost',
    'temporary failure'
  ];

  const errorMessage = error.message?.toLowerCase() || '';
  return retryableMessages.some(msg => 
    errorMessage.includes(msg.toLowerCase())
  );
}

module.exports = {
  withRetry,
  isRetryableDBError,
  isRetryableEmailError
};
