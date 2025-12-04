import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const LOG_DIR = path.join(os.homedir(), '.config', 'rsx-language-server');
const LOG_FILE = path.join(LOG_DIR, 'server.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 5MB

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

class Logger {
    private level: LogLevel = LogLevel.INFO;
    private stream: fs.WriteStream | null = null;
    private initialized = false;

    init(level: LogLevel = LogLevel.INFO) {
        if (this.initialized) return;

        this.level = level;

        try {
            if (!fs.existsSync(LOG_DIR)) {
                fs.mkdirSync(LOG_DIR, { recursive: true });
            }

            this.rotateLogIfNeeded();

            this.stream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
            this.initialized = true;

            this.info('Logger initialized', { logDir: LOG_DIR, level: LogLevel[level] });
        } catch (err) {
            console.error('[RSX Logger] Failed to initialize:', err);
        }
    }

    private rotateLogIfNeeded() {
        try {
            if (fs.existsSync(LOG_FILE)) {
                const stats = fs.statSync(LOG_FILE);
                if (stats.size > MAX_LOG_SIZE) {
                    const backupFile = LOG_FILE + '.old';
                    if (fs.existsSync(backupFile)) {
                        fs.unlinkSync(backupFile);
                    }
                    fs.renameSync(LOG_FILE, backupFile);
                }
            }
        } catch (err) {
            console.error('[RSX Logger] Failed to rotate log:', err);
        }
    }

    private formatMessage(level: string, message: string, data?: object): string {
        const timestamp = new Date().toISOString();
        let log = `[${timestamp}] [${level}] ${message}`;
        if (data) {
            log += ` ${JSON.stringify(data)}`;
        }
        return log + '\n';
    }

    private write(level: LogLevel, levelName: string, message: string, data?: object) {
        if (level < this.level) return;

        const formatted = this.formatMessage(levelName, message, data);

        if (this.stream) {
            this.stream.write(formatted);
        }

        if (level >= LogLevel.WARN) {
            console.error(formatted.trim());
        }
    }

    debug(message: string, data?: object) {
        this.write(LogLevel.DEBUG, 'DEBUG', message, data);
    }

    info(message: string, data?: object) {
        this.write(LogLevel.INFO, 'INFO', message, data);
    }

    warn(message: string, data?: object) {
        this.write(LogLevel.WARN, 'WARN', message, data);
    }

    error(message: string, data?: object) {
        this.write(LogLevel.ERROR, 'ERROR', message, data);
    }

    close() {
        if (this.stream) {
            this.stream.end();
            this.stream = null;
        }
        this.initialized = false;
    }
}

export const logger = new Logger();
