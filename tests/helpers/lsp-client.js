const { spawn } = require('child_process');
const path = require('path');

/**
 * LSP Client for testing
 */
class LSPClient {
    constructor(serverPath) {
        this.serverPath = serverPath;
        this.process = null;
        this.messageBuffer = '';
        this.messageHandlers = new Map();
        this.nextId = 1;
        this.isInitialized = false;
    }

    /**
     * Start the LSP server
     */
    async start() {
        return new Promise((resolve, reject) => {
            this.process = spawn('node', [this.serverPath, '--stdio'], {
                cwd: path.dirname(this.serverPath)
            });

            this.process.stdout.on('data', (data) => {
                this.handleData(data);
            });

            this.process.stderr.on('data', (data) => {
                console.error('LSP Error:', data.toString());
            });

            this.process.on('error', (err) => {
                reject(err);
            });

            this.process.on('close', (code) => {
                console.log(`LSP process exited with code ${code}`);
            });

            // Wait a bit for the process to start
            setTimeout(resolve, 100);
        });
    }

    /**
     * Handle incoming data from LSP server
     */
    handleData(data) {
        this.messageBuffer += data.toString();

        while (true) {
            const headerEnd = this.messageBuffer.indexOf('\r\n\r\n');
            if (headerEnd === -1) break;

            const header = this.messageBuffer.substring(0, headerEnd);
            const contentLengthMatch = header.match(/Content-Length: (\d+)/);
            
            if (!contentLengthMatch) {
                this.messageBuffer = this.messageBuffer.substring(headerEnd + 4);
                continue;
            }

            const contentLength = parseInt(contentLengthMatch[1], 10);
            const messageStart = headerEnd + 4;
            const messageEnd = messageStart + contentLength;

            if (this.messageBuffer.length < messageEnd) {
                break; // Wait for more data
            }

            const messageContent = this.messageBuffer.substring(messageStart, messageEnd);
            this.messageBuffer = this.messageBuffer.substring(messageEnd);

            try {
                const message = JSON.parse(messageContent);
                this.handleMessage(message);
            } catch (err) {
                // Ignore parse errors - may be partial/malformed message
                // console.error('Failed to parse message:', err);
            }
        }
    }

    /**
     * Handle a parsed LSP message
     */
    handleMessage(message) {
        if (message.id !== undefined && this.messageHandlers.has(message.id)) {
            const handler = this.messageHandlers.get(message.id);
            this.messageHandlers.delete(message.id);
            handler(message);
        }
    }

    /**
     * Send a request to the LSP server
     */
    sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            const id = this.nextId++;
            const message = {
                jsonrpc: '2.0',
                id,
                method,
                params
            };

            const timeout = setTimeout(() => {
                this.messageHandlers.delete(id);
                reject(new Error(`Request timeout: ${method}`));
            }, 5000);

            this.messageHandlers.set(id, (response) => {
                clearTimeout(timeout);
                if (response.error) {
                    reject(new Error(response.error.message || JSON.stringify(response.error)));
                } else {
                    resolve(response.result);
                }
            });

            this.write(message);
        });
    }

    /**
     * Send a notification to the LSP server
     */
    sendNotification(method, params) {
        const message = {
            jsonrpc: '2.0',
            method,
            params
        };
        this.write(message);
    }

    /**
     * Write a message to the LSP server
     */
    write(message) {
        const content = JSON.stringify(message);
        const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
        this.process.stdin.write(header + content);
    }

    /**
     * Initialize the LSP server
     */
    async initialize(rootUri = null) {
        const result = await this.sendRequest('initialize', {
            processId: process.pid,
            rootUri: rootUri || `file://${process.cwd()}`,
            capabilities: {
                textDocument: {
                    hover: { contentFormat: ['markdown', 'plaintext'] },
                    completion: {
                        completionItem: {
                            snippetSupport: true,
                            documentationFormat: ['markdown', 'plaintext']
                        }
                    },
                    definition: { linkSupport: true },
                    references: {},
                    documentSymbol: {},
                    formatting: {},
                    rangeFormatting: {},
                    semanticTokens: {
                        tokenTypes: ['namespace', 'class', 'enum', 'interface', 'typeParameter', 'type', 'parameter', 'variable', 'property', 'enumMember', 'function', 'method'],
                        tokenModifiers: ['declaration', 'readonly', 'static', 'async', 'defaultLibrary', 'local'],
                        formats: ['relative']
                    }
                },
                workspace: {
                    workspaceFolders: true,
                    configuration: true
                }
            },
            initializationOptions: {}
        });

        this.sendNotification('initialized', {});
        this.isInitialized = true;
        return result;
    }

    /**
     * Open a document
     */
    openDocument(uri, languageId, version, text) {
        this.sendNotification('textDocument/didOpen', {
            textDocument: {
                uri,
                languageId,
                version,
                text
            }
        });
    }

    /**
     * Change a document
     */
    changeDocument(uri, version, changes) {
        this.sendNotification('textDocument/didChange', {
            textDocument: { uri, version },
            contentChanges: changes
        });
    }

    /**
     * Request hover information
     */
    async hover(uri, position) {
        return this.sendRequest('textDocument/hover', {
            textDocument: { uri },
            position
        });
    }

    /**
     * Request completion
     */
    async completion(uri, position) {
        return this.sendRequest('textDocument/completion', {
            textDocument: { uri },
            position
        });
    }

    /**
     * Request definition
     */
    async definition(uri, position) {
        return this.sendRequest('textDocument/definition', {
            textDocument: { uri },
            position
        });
    }

    /**
     * Request document symbols
     */
    async documentSymbols(uri) {
        return this.sendRequest('textDocument/documentSymbol', {
            textDocument: { uri }
        });
    }

    /**
     * Request formatting
     */
    async formatting(uri, options) {
        return this.sendRequest('textDocument/formatting', {
            textDocument: { uri },
            options: options || { tabSize: 4, insertSpaces: true }
        });
    }

    /**
     * Shutdown and exit the LSP server
     */
    async shutdown() {
        try {
            await this.sendRequest('shutdown', null);
        } catch (err) {
            // Ignore shutdown errors
        }
        this.sendNotification('exit', null);
        
        return new Promise((resolve) => {
            if (this.process) {
                this.process.on('close', resolve);
                setTimeout(() => {
                    if (this.process) {
                        this.process.kill();
                    }
                    resolve();
                }, 1000);
            } else {
                resolve();
            }
        });
    }
}

module.exports = { LSPClient };
