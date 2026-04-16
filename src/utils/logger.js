const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const currentLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function timestamp() {
  return new Date().toISOString();
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

const logger = {
  debug(tag, ...args) {
    if (shouldLog('debug')) console.log(`[${timestamp()}] [DEBUG] [${tag}]`, ...args);
  },
  info(tag, ...args) {
    if (shouldLog('info')) console.log(`[${timestamp()}] [INFO] [${tag}]`, ...args);
  },
  warn(tag, ...args) {
    if (shouldLog('warn')) console.warn(`[${timestamp()}] [WARN] [${tag}]`, ...args);
  },
  error(tag, ...args) {
    if (shouldLog('error')) console.error(`[${timestamp()}] [ERROR] [${tag}]`, ...args);
  }
};

module.exports = logger;
