#!/usr/bin/env node

/**
 * Test Summary Generator
 * Runs all tests and generates a summary report
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const testFiles = [
    '01-initialization.test.js',
    '02-completion.test.js',
    '03-hover.test.js',
    '04-document-parsing.test.js',
    '05-typescript-integration.test.js',
    '06-error-handling.test.js'
];

const testDescriptions = {
    '01-initialization.test.js': 'LSP Server Initialization',
    '02-completion.test.js': 'Code Completion Features',
    '03-hover.test.js': 'Hover Information',
    '04-document-parsing.test.js': 'Document Parsing',
    '05-typescript-integration.test.js': 'TypeScript Integration',
    '06-error-handling.test.js': 'Error Handling'
};

async function runTest(testFile) {
    return new Promise((resolve) => {
        const testPath = path.join(__dirname, testFile);
        const proc = spawn('node', ['--test', testPath], {
            cwd: path.join(__dirname, '..')
        });

        let output = '';
        let passed = 0;
        let failed = 0;

        proc.stdout.on('data', (data) => {
            output += data.toString();
        });

        proc.stderr.on('data', (data) => {
            output += data.toString();
        });

        proc.on('close', (code) => {
            // Parse TAP output
            const lines = output.split('\n');
            for (const line of lines) {
                if (line.trim().startsWith('ok ')) {
                    passed++;
                } else if (line.trim().startsWith('not ok ')) {
                    failed++;
                }
            }

            resolve({
                file: testFile,
                passed,
                failed,
                total: passed + failed,
                success: code === 0,
                output
            });
        });
    });
}

async function main() {
    console.log('🧪 RSX Language Server Test Suite\n');
    console.log('='.repeat(60));
    console.log('');

    const results = [];
    let totalPassed = 0;
    let totalFailed = 0;

    for (const testFile of testFiles) {
        process.stdout.write(`Running ${testDescriptions[testFile]}... `);

        const result = await runTest(testFile);
        results.push(result);

        totalPassed += result.passed;
        totalFailed += result.failed;

        if (result.success) {
            console.log(`✅ (${result.passed}/${result.total})`);
        } else {
            console.log(`❌ (${result.passed}/${result.total})`);
        }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:\n');

    for (const result of results) {
        const status = result.success ? '✅' : '❌';
        const percentage = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : '0.0';

        console.log(`${status} ${testDescriptions[result.file]}`);
        console.log(`   Passed: ${result.passed}/${result.total} (${percentage}%)`);

        if (result.failed > 0) {
            console.log(`   Failed: ${result.failed}`);
        }
        console.log('');
    }

    const totalTests = totalPassed + totalFailed;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

    console.log('='.repeat(60));
    console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed (${successRate}%)\n`);

    if (totalFailed === 0) {
        console.log('🎉 All tests passed!\n');
        process.exit(0);
    } else {
        console.log(`⚠️  ${totalFailed} test(s) failed\n`);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Error running tests:', err);
    process.exit(1);
});
