const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "..", "logs");
const logFile = path.join(logDir, "backend.log");

const ensureLogDir = () => {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

const formatMeta = (meta) => {
  if (meta === undefined) {
    return "";
  }

  if (typeof meta === "string") {
    return ` ${meta}`;
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [unserializable meta]";
  }
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const msg = typeof message === "string" ? message : JSON.stringify(message);
  return `[${timestamp}] [${level}] ${msg}${formatMeta(meta)}\n`;
};

const writeLog = (level, message, meta) => {
  const formatted = formatMessage(level, message, meta);
  ensureLogDir();
  fs.appendFileSync(logFile, formatted);

  if (level === "ERROR") {
    console.error(formatted.trim());
  } else if (level === "WARN") {
    console.warn(formatted.trim());
  } else {
    console.log(formatted.trim());
  }
};

module.exports = {
  info: (message, meta) => writeLog("INFO", message, meta),
  warn: (message, meta) => writeLog("WARN", message, meta),
  error: (message, meta) => writeLog("ERROR", message, meta),
  filePath: logFile,
};
