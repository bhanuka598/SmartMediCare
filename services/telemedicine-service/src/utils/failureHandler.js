/**
 * Failure handling utilities for inter-service communication
 * Implements retry logic, timeouts, and circuit breaker patterns
 */

const axios = require("axios");

/**
 * Default configuration for retry logic
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  timeout: 5000, // ms
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504, 0] // 0 = network error
};

/**
 * Sleep/delay helper
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if error is retryable
 * @param {Error} error - Axios error
 * @param {number[]} retryableStatusCodes - Status codes that should trigger retry
 * @returns {boolean}
 */
const isRetryableError = (error, retryableStatusCodes) => {
  // Network errors (no response)
  if (!error.response) return true;
  
  // Check status code
  const statusCode = error.response.status;
  return retryableStatusCodes.includes(statusCode);
};

/**
 * Execute HTTP request with retry logic and timeout
 * @param {Function} requestFn - Function that returns a promise (axios call)
 * @param {Object} config - Retry configuration
 * @param {string} serviceName - Name of service being called (for logging)
 * @returns {Promise<any>}
 */
const executeWithRetry = async (requestFn, config = {}, serviceName = "unknown") => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const { maxRetries, retryDelay, timeout, backoffMultiplier, retryableStatusCodes } = retryConfig;
  
  let lastError;
  let currentDelay = retryDelay;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Execute request with timeout signal
      const result = await requestFn({ signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      // Success - return result
      if (attempt > 1) {
        console.log(`[${serviceName}] Request succeeded on attempt ${attempt}`);
      }
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Check if it was a timeout
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        console.error(`[${serviceName}] Request timeout on attempt ${attempt}/${maxRetries}`);
      } else {
        console.error(`[${serviceName}] Request failed on attempt ${attempt}/${maxRetries}:`, error.message);
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Check if error is retryable
      if (!isRetryableError(error, retryableStatusCodes)) {
        console.error(`[${serviceName}] Non-retryable error, stopping retries`);
        throw error;
      }
      
      // Wait before retry with exponential backoff
      console.log(`[${serviceName}] Retrying in ${currentDelay}ms...`);
      await sleep(currentDelay);
      currentDelay *= backoffMultiplier;
    }
  }
  
  // All retries exhausted
  const finalError = new Error(
    `[${serviceName}] All ${maxRetries} retry attempts failed. Last error: ${lastError.message}`
  );
  finalError.originalError = lastError;
  finalError.code = 'MAX_RETRIES_EXCEEDED';
  throw finalError;
};

/**
 * Make HTTP request with failure handling
 * @param {Object} axiosConfig - Axios request config
 * @param {Object} retryConfig - Retry configuration
 * @param {string} serviceName - Name of service being called
 * @returns {Promise<any>}
 */
const httpRequestWithRetry = async (axiosConfig, retryConfig = {}, serviceName = "unknown") => {
  return executeWithRetry(
    ({ signal }) => axios({ ...axiosConfig, signal }),
    retryConfig,
    serviceName
  );
};

/**
 * Circuit breaker for service calls
 * Prevents cascading failures when a service is down
 */
class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30s
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.halfOpenCalls = 0;
        console.log(`[${this.serviceName}] Circuit breaker entering HALF_OPEN state`);
      } else {
        throw new Error(`[${this.serviceName}] Circuit breaker is OPEN - service unavailable`);
      }
    }
    
    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new Error(`[${this.serviceName}] Circuit breaker HALF_OPEN - max calls reached`);
    }
    
    try {
      if (this.state === 'HALF_OPEN') {
        this.halfOpenCalls++;
      }
      
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxCalls) {
        console.log(`[${this.serviceName}] Circuit breaker closing - service recovered`);
        this.state = 'CLOSED';
        this.successCount = 0;
        this.halfOpenCalls = 0;
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      console.error(`[${this.serviceName}] Circuit breaker opening - ${this.failureThreshold} failures detected`);
      this.state = 'OPEN';
    }
  }
  
  getState() {
    return {
      service: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount
    };
  }
}

/**
 * Wrap service call with circuit breaker
 * @param {CircuitBreaker} breaker - Circuit breaker instance
 * @param {Function} operation - Async operation to execute
 * @param {Object} fallback - Fallback value on failure
 * @returns {Promise<any>}
 */
const withCircuitBreaker = async (breaker, operation, fallback = null) => {
  try {
    return await breaker.execute(operation);
  } catch (error) {
    console.error(`[${breaker.serviceName}] Circuit breaker error:`, error.message);
    if (fallback !== null) {
      console.log(`[${breaker.serviceName}] Returning fallback value`);
      return fallback;
    }
    throw error;
  }
};

module.exports = {
  executeWithRetry,
  httpRequestWithRetry,
  CircuitBreaker,
  withCircuitBreaker,
  sleep,
  DEFAULT_RETRY_CONFIG
};
