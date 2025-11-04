import { promises as fs, appendFileSync } from 'fs';
import { format } from 'util';

interface LoggerOptions {
	debug?: boolean;
	useSync?: boolean; // Option to use synchronous writes
}

export class OptimisedLogger {
	private static useSync = true; // Default to synchronous for immediate writes
	private static isInitialized = false;

	static configure(options: LoggerOptions = {}) {
		this.useSync = options.useSync ?? true;
		this.isInitialized = true;
	}

	private static async writeToFile(file: string, content: string) {
		if (this.useSync) {
			// Synchronous write - blocks but guarantees immediate write
			try {
				appendFileSync(file, content);
			} catch (error) {
				console.error(`Failed to write to ${file}:`, error);
			}
		} else {
			// Asynchronous write - non-blocking but still immediate
			try {
				await fs.appendFile(file, content);
			} catch (error) {
				console.error(`Failed to write to ${file}:`, error);
			}
		}
	}

	private static logEntry(type: string, file: string, color: string, ...args: any[]) {
		const timestamp = new Date().toISOString();

		// Print immediately with color
		console.log(color, `[${timestamp}][${type}]`, ...args, '\x1b[0m');

		// Write to file immediately
		const message = format(...args);
		const logLine = `[${timestamp}][${type}] ${message}\n`;
		this.writeToFile(file, logLine);
	}

	// Core logging methods
	static processWarn(...args: any[]) {
		this.logEntry('PROCESS_WARN', 'process.txt', '\x1b[36m', ...args);
	}

	static processError(errorType: string, error: Error) {
		const errorMsg = `${error.name}\n${error.stack}`;
		this.logEntry('PROCESS_ERROR', 'process.txt', '\x1b[36m', `[${errorType}]`, errorMsg);
	}

	static error(error: Error, ...args: any[]) {
		const errorMsg = `${error.name}\n${error.stack}`;
		this.logEntry('ERROR', 'log.txt', '\x1b[31m', ...args, errorMsg);
	}

	static enhancedError(...args: any[]) {
		const error = args[args.length - 1];
		if (error instanceof Error) {
			const errorMsg = `${error.name}\n${error.stack}`;
			this.logEntry('ENHANCED_ERROR', 'log.txt', '\x1b[31m', ...args.slice(0, -1), errorMsg);
		}
	}

	static info(...args: any[]) {
		this.logEntry('INFO', 'log.txt', '\x1b[36m', ...args);
	}

	static warn(...args: any[]) {
		this.logEntry('WARN', 'log.txt', '\x1b[33m', ...args);
	}

	static success(...args: any[]) {
		this.logEntry('SUCCESS', 'log.success.txt', '\x1b[32m', ...args);
	}

	static carted(...args: any[]) {
		this.logEntry('CARTED', 'log.carted.txt', '\x1b[34m', ...args);
	}

	static save(...args: any[]) {
		this.logEntry('LEGIT_CART', 'save.txt', '\x1b[35m', ...args);
	}

	static failedCart(...args: any[]) {
		this.logEntry('FAILED_CART', 'failedCart.txt', '\x1b[38m', ...args);
	}

	static cookies(...args: any[]) {
		this.logEntry('COOKIES', 'cookies.txt', '\x1b[34m', ...args, '\n--------------------');
	}

	// CSV logging methods
	private static csvEntry(file: string, type: string, ...args: any[]) {
		const timestamp = new Date().toISOString();
		const message = format(...args);
		console.log('\x1b[35m', `[${timestamp}][${type}]`, message.split(',')[0], '\x1b[0m');

		// Check if file exists, if not write header
		const header = 'email,password,proxy,imap-email,imap-password,eventId,sortc,\n';

		// Write CSV entry immediately
		const csvLine = `${message}\n`;

		if (this.useSync) {
			try {
				// Check if file exists
				const fileExists = require('fs').existsSync(file);
				if (!fileExists) {
					appendFileSync(file, header);
				}
				appendFileSync(file, csvLine);
			} catch (error) {
				console.error(`Failed to write CSV to ${file}:`, error);
			}
		} else {
			// Async version with header check
			fs.access(file)
				.then(() => {
					// File exists, just append
					return fs.appendFile(file, csvLine);
				})
				.catch(() => {
					// File doesn't exist, write header first
					return fs.appendFile(file, header + csvLine);
				})
				.catch((error) => {
					console.error(`Failed to write CSV to ${file}:`, error);
				});
		}
	}

	static login(...args: any[]) {
		this.csvEntry('login/login.success.csv', 'LOGIN_SAVED', ...args);
	}

	static loginFailed(...args: any[]) {
		this.csvEntry('login/login.failed.csv', 'FAILED_LOGIN', ...args);
	}

	static importCsv(...args: any[]) {
		this.csvEntry('login/import.csv', 'IMPORT_CSV', ...args);
	}

	static consolidate(...args: any[]) {
		this.csvEntry('sheets/consolidated.csv', 'CSV_LOG', ...args);
	}

	static log(...args: any[]) {
		const timestamp = new Date().toISOString();
		console.log(`[LOG][${timestamp}]`, ...args);
		const message = format(...args);
		const logLine = `[LOG][${timestamp}] ${message}\n`;
		this.writeToFile('log.txt', logLine);
	}

	// No longer needed for immediate writes, but kept for API compatibility
	static async flush() {
		// No-op since we write immediately
		return Promise.resolve();
	}

	// Cleanup
	static destroy() {
		this.isInitialized = false;
	}
}

// Initialize with default settings
OptimisedLogger.configure();
