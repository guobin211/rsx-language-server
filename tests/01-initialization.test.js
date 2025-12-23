const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { LSPClient } = require('./helpers/lsp-client.js');

describe('LSP Server Initialization', () => {
    let client;
    const serverPath = path.join(__dirname, '..', 'bin', 'rsx-language-server.js');

    before(async () => {
        client = new LSPClient(serverPath);
        await client.start();
    });

    after(async () => {
        if (client) {
            await client.shutdown();
        }
    });

    test('should initialize successfully', async () => {
        const result = await client.initialize();

        assert.ok(result, 'Initialize result should exist');
        assert.ok(result.capabilities, 'Capabilities should exist');
    });

    test('should support text document sync', async () => {
        const result = await client.initialize();

        assert.ok(result.capabilities.textDocumentSync, 'Text document sync should be supported');
        assert.strictEqual(typeof result.capabilities.textDocumentSync, 'number');
    });

    test('should support completion', async () => {
        const result = await client.initialize();

        assert.ok(result.capabilities.completionProvider, 'Completion should be supported');
        assert.ok(
            Array.isArray(result.capabilities.completionProvider.triggerCharacters),
            'Trigger characters should be an array'
        );
        assert.ok(
            result.capabilities.completionProvider.triggerCharacters.length > 0,
            'Should have trigger characters'
        );
    });

    test('should support hover', async () => {
        const result = await client.initialize();

        assert.strictEqual(result.capabilities.hoverProvider, true, 'Hover should be supported');
    });

    test('should support definition', async () => {
        const result = await client.initialize();

        assert.strictEqual(result.capabilities.definitionProvider, true, 'Definition should be supported');
    });

    test('should support references', async () => {
        const result = await client.initialize();

        assert.strictEqual(result.capabilities.referencesProvider, true, 'References should be supported');
    });

    test('should support document symbols', async () => {
        const result = await client.initialize();

        assert.strictEqual(result.capabilities.documentSymbolProvider, true, 'Document symbols should be supported');
    });

    test('should support formatting', async () => {
        const result = await client.initialize();

        assert.strictEqual(
            result.capabilities.documentFormattingProvider,
            true,
            'Document formatting should be supported'
        );
        assert.strictEqual(
            result.capabilities.documentRangeFormattingProvider,
            true,
            'Range formatting should be supported'
        );
    });

    test('should support semantic tokens', async () => {
        const result = await client.initialize();

        assert.ok(result.capabilities.semanticTokensProvider, 'Semantic tokens should be supported');
        assert.ok(result.capabilities.semanticTokensProvider.legend, 'Legend should exist');
        assert.ok(
            Array.isArray(result.capabilities.semanticTokensProvider.legend.tokenTypes),
            'Token types should be an array'
        );
        assert.ok(
            Array.isArray(result.capabilities.semanticTokensProvider.legend.tokenModifiers),
            'Token modifiers should be an array'
        );
    });

    test('should support workspace features', async () => {
        const result = await client.initialize();

        assert.ok(result.capabilities.workspace, 'Workspace capabilities should exist');
        assert.ok(result.capabilities.workspace.workspaceFolders, 'Workspace folders should be supported');
    });
});
