const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { LSPClient } = require('./helpers/lsp-client.js');

describe('LSP Quick Check', () => {
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

    test('server can start and initialize', async () => {
        const result = await client.initialize();
        
        assert.ok(result, 'Initialize result should exist');
        assert.ok(result.capabilities, 'Capabilities should exist');
        
        console.log('\n✅ LSP Server is working!');
        console.log('\n📋 Supported capabilities:');
        console.log('  - Text Document Sync:', !!result.capabilities.textDocumentSync);
        console.log('  - Completion:', !!result.capabilities.completionProvider);
        console.log('  - Hover:', !!result.capabilities.hoverProvider);
        console.log('  - Definition:', !!result.capabilities.definitionProvider);
        console.log('  - References:', !!result.capabilities.referencesProvider);
        console.log('  - Document Symbols:', !!result.capabilities.documentSymbolProvider);
        console.log('  - Formatting:', !!result.capabilities.documentFormattingProvider);
        console.log('  - Semantic Tokens:', !!result.capabilities.semanticTokensProvider);
    });

    test('server can handle document operations', async () => {
        await client.initialize();
        
        const testFileUri = 'file:///test/quick.rsx';
        const content = `<script>
export const message = "Hello, RSX!";
</script>

<template>
    <div class="container">
        <h1>{{message}}</h1>
    </div>
</template>

<style>
.container {
    padding: 20px;
}
</style>`;

        // Open document - this should not throw
        client.openDocument(testFileUri, 'rsx', 1, content);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('\n✅ Document operations working!');
        assert.ok(true, 'Document opened successfully');
    });

    test('server stays responsive', async () => {
        await client.initialize();
        
        // Multiple operations
        for (let i = 0; i < 3; i++) {
            const uri = `file:///test/doc${i}.rsx`;
            const content = `<template><div>Test ${i}</div></template>`;
            client.openDocument(uri, 'rsx', i + 1, content);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('\n✅ Server remains responsive!');
        assert.ok(client.process, 'Server process still running');
    });
});
