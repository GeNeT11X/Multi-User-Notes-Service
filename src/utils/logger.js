const timestamp = () => new Date().toISOString();

const logger = {
  info:  (...args) => console.log(`[INFO]  ${timestamp()}`, ...args),
  error: (...args) => console.error(`[ERROR] ${timestamp()}`, ...args),
  warn:  (...args) => console.warn(`[WARN]  ${timestamp()}`, ...args),
};

module.exports = logger;
