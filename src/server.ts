import { createConnection, createServer, createSimpleProject, loadTsdkByPath } from '@volar/language-server/node';
import { create as createHtmlService } from 'volar-service-html';
import { create as createCssService } from 'volar-service-css';
import { create as createTypeScriptServices } from 'volar-service-typescript';
import { create as createEmmetService } from 'volar-service-emmet';
import { rsxLanguagePlugin } from './plugin';
import { createRsxService } from './service';
import { logger, LogLevel } from './logger';
import * as path from 'node:path';

logger.init(LogLevel.INFO);

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
    logger.info('Server initializing', {
        rootUri: params.rootUri,
        capabilities: Object.keys(params.capabilities)
    });

    const tsdk = loadTsdkByPath(
        params.initializationOptions?.typescript?.tsdk ?? path.dirname(require.resolve('typescript/lib/typescript.js')),
        params.locale
    );

    logger.debug('TypeScript SDK loaded', { locale: params.locale });

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
