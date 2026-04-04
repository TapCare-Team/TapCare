type LogContext = Record<string, string | number | boolean | undefined>;

function format(level: "INFO" | "WARN" | "ERROR", message: string, context?: LogContext) {
  return JSON.stringify({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString()
  });
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.info(format("INFO", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(format("WARN", message, context));
  },
  error(message: string, context?: LogContext) {
    console.error(format("ERROR", message, context));
  }
};
