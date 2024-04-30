import { createLogger, format, transports } from "winston";
import { Log } from'../models/log.js';

const { combine, timestamp, printf } = format;
const log = getLogger();

export function getLogger() {
  const myFormat = printf(({ level, message, timestamp }) => {
    return `${ timestamp } ${ level.toUpperCase() }: ${ message }`;
  });
  const logLevel = process.env.LOG_LEVEL;
  const logger = createLogger({
    level: logLevel || "info",
    format: combine(timestamp(), myFormat),
    transports: [ new transports.Console() ],
  });
  return logger;
}


export async function logEvent({ level, owner, text, data=null }) {
  const levels = ["info", "warn", "error"];
  if (!level || !levels.includes(level)) {
    throw new Error(`'level' is required and must be one of '${levels}'`);
  }
  if (!text) {
    throw new Error(`'text' is required`);
  }
  try {
    await Log.create({ level, owner, text, data });
  } catch (error) {
    log.error(`Couldn't update logs table: ${level}: ${text}`);
  }
}
