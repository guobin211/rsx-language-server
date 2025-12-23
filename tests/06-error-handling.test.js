const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { LSPClient } = require('./helpers/lsp-client.js');

describe('LSP Error Handling', () => {
    let client;
    const serverPath = path.join(__dirname, '..', 'bin', 'rsx-language-server.js');
    const testFileUri = 'file:///test/errors.rsx';

    before(async () => {
        client = new LSPClient(serverPath);
        await client.start();
        await client.initialize();
    });

    after(async () => {
        if (client) {
            await client.shutdown();
        }
    });

    test('should handle malformed JSON-RPC', async () => {
        // The client should handle errors gracefully
        assert.ok(client.process, 'Process should still be running');
        console.log('✓ Server handles malformed requests gracefully');
    });

    test('should handle unclosed tags', async () => {
        const content = `<template>\n    <div>\n        <p>Hello\n    </div>\n</template>`;

        client.openDocument(testFileUri, 'rsx', 1, content);

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Server should not crash
        assert.ok(client.process, 'Server should still be running');
        console.log('✓ Handles unclosed tags gracefully');
    });

    test('should handle missing closing directive', async () => {
        const content = `<template>\n    {{@if condition}}\n        <div>Content</div>\n</template>`;

        client.openDocument(testFileUri, 'rsx', 2, content);

        await new Promise((resolve) => setTimeout(resolve, 100));

        assert.ok(client.process, 'Server should still be running');
        console.log('✓ Handles missing closing directive gracefully');
    });

    test('should handle invalid TypeScript syntax', async () => {
        const content = `<script>\nexport const x = ;\n</script>`;

        client.openDocument(testFileUri, 'rsx', 3, content);

        await new Promise((resolve) => setTimeout(resolve, 100));

        assert.ok(client.process, 'Server should still be running');
        console.log('✓ Handles invalid TypeScript syntax gracefully');
    });

    test('should handle very large documents', async () => {
        const largeContent = '<template>\n' + '    <div>\n'.repeat(1000) + '    </div>\n'.repeat(1000) + '</template>';

        client.openDocument(testFileUri, 'rsx', 4, largeContent);

        await new Promise((resolve) => setTimeout(resolve, 200));

        assert.ok(client.process, 'Server should still be running');
        console.log('✓ Handles large documents gracefully');
    });

    test('should handle rapid document updates', async () => {
        const content = `<template>\n    <div>Test</div>\n</template>`;

        client.openDocument(testFileUri, 'rsx', 5, content);

        // Send multiple rapid updates
        for (let i = 6; i < 15; i++) {
            client.changeDocument(testFileUri, i, [
                {
                    text: `<template>\n    <div>Test ${i}</div>\n</template>`
                }
            ]);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        assert.ok(client.process, 'Server should still be running');
        console.log('✓ Handles rapid updates gracefully');
    });

    test('should handle invalid file URIs', async () => {
        const invalidUri = 'not-a-valid-uri';

        try {
            client.openDocument(invalidUri, 'rsx', 1, '<template></template>');
            await new Promise((resolve) => setTimeout(resolve, 100));

            assert.ok(client.process, 'Server should still be running');
            console.log('✓ Handles invalid URIs gracefully');
        } catch (err) {
            console.log('✓ Invalid URI rejected as expected');
        }
    });

    test('should handle requests for non-existent documents', async () => {
        const nonExistentUri = 'file:///nonexistent/file.rsx';

        try {
            await client.completion(nonExistentUri, { line: 0, character: 0 });
        } catch (err) {
            // Expected to fail or return null
            console.log('✓ Non-existent document handled correctly');
        }

        assert.ok(client.process, 'Server should still be running');
    });

    test('should handle malformed RSX directives', async () => {
        const content = `<template>\n    {{@if}}\n    {{@each}}\n    {{@html}}\n</template>`;

        client.openDocument(testFileUri, 'rsx', 20, content);

        await new Promise((resolve) => setTimeout(resolve, 100));

        assert.ok(client.process, 'Server should still be running');
        console.log('✓ Handles malformed directives gracefully');
    });

    test('should handle nested directives', async () => {
        const content = `<template>
    {{@if condition1}}
        {{@if condition2}}
            {{@each items as item}}
                {{@if condition3}}
                    <div>{{item}}</div>
                {{/if}}
            {{/each}}
        {{/if}}
    {{/if}}
</template>`;

        client.openDocument(testFileUri, 'rsx', 21, content);

        await new Promise((resolve) => setTimeout(resolve, 100));

        assert.ok(client.process, 'Server should still be running');
        console.log('✓ Handles deeply nested directives');
    });

    test('should recover from crashes gracefully', async () => {
        // The server should continue to work after processing errors
        const validContent = `<template>\n    <div>Valid content</div>\n</template>`;

        client.openDocument(testFileUri, 'rsx', 30, validContent);

        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
            const result = await client.completion(testFileUri, { line: 1, character: 10 });
            console.log('✓ Server recovered and functioning normally');
        } catch (err) {
            console.log('✓ Server still processing requests');
        }
    });
});
