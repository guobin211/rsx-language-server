import { createConnection, createServer, createSimpleProject, loadTsdkByPath } from '@volar/language-server/node';
import { create as createHtmlService } from 'volar-service-html';
import { create as createCssService } from 'volar-service-css';
import { create as createTypeScriptServices } from 'volar-service-typescript';
import { create as createEmmetService } from 'volar-service-emmet';
import { rsxLanguagePlugin } from './plugin';
import { createRsxService } from './service';
import { logger, LogLevel } from './logger';
import * as path from 'node:path';
import * as fs from 'node:fs';

logger.init(LogLevel.INFO);

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
    logger.info('Server initializing', {
        rootUri: params.rootUri,
        capabilities: Object.keys(params.capabilities)
    });

    function findProjectRoot(from: string) {
        let dir = from;
        while (true) {
            if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
            const parent = path.dirname(dir);
            if (parent === dir) break;
            dir = parent;
        }
        return undefined;
    }

    const projectRoot = findProjectRoot(__dirname) ?? findProjectRoot(process.cwd());

    let defaultTsdk: string;
    if (projectRoot) {
        try {
            const tsResolvePath = require.resolve('typescript', { paths: [projectRoot] });
            defaultTsdk = path.join(path.dirname(tsResolvePath));
        } catch {
            defaultTsdk = path.join(projectRoot, 'node_modules', 'typescript');
        }
    } else {
        try {
            const tsResolvePath = require.resolve('typescript');
            defaultTsdk = path.join(path.dirname(tsResolvePath));
        } catch {
            defaultTsdk = path.join(process.cwd(), 'node_modules', 'typescript');
        }
    }

    const tsdk = loadTsdkByPath(params.initializationOptions?.typescript?.tsdk ?? defaultTsdk, params.locale);

    logger.info('TypeScript SDK loaded', { locale: params.locale, tsdk });

    const tsServices = createTypeScriptServices(tsdk.typescript, tsdk.diagnosticMessages);

    return server.initialize(params, createSimpleProject([rsxLanguagePlugin]), [
        createHtmlService(),
        createCssService(),
        ...tsServices,
        createEmmetService(),
        createRsxService()
    ]);
});

connection.onInitialized(() => {
    server.initialized();
    logger.info('Server initialized with Volar services');
    connection.console.log('[RSX] Language Server initialized');
});

connection.onShutdown(() => {
    logger.info('Server shutting down');
    logger.close();
    server.shutdown();
});
