import type { CodeMapping, LanguagePlugin, VirtualCode, CodeInformation } from '@volar/language-core';
import RSXParser, { RSXFile, ParsedSection, TemplateSection } from 'tree-sitter-rsx/parser';
import type ts from 'typescript';
import type { URI } from 'vscode-uri';
import { logger } from './logger';

const FULL_FEATURES: CodeInformation = {
    verification: true,
    completion: true,
    semantic: true,
    navigation: true,
    structure: true,
    format: true
};

export const rsxLanguagePlugin: LanguagePlugin<URI> = {
    getLanguageId(uri) {
        if (uri.path.endsWith('.rsx')) {
            return 'rsx';
        }
        return undefined;
    },

    createVirtualCode(uri, languageId, snapshot) {
        if (languageId === 'rsx') {
            return new RsxVirtualCode(uri, snapshot);
        }
        return undefined;
    },

    updateVirtualCode(_uri, virtualCode, snapshot) {
        if (virtualCode instanceof RsxVirtualCode) {
            virtualCode.update(snapshot);
        }
        return virtualCode;
    },

    typescript: {
        extraFileExtensions: [
            {
                extension: 'rsx',
                isMixedContent: true,
                scriptKind: 7 // TSX
            }
        ],
        getServiceScript(root) {
            for (const code of root.embeddedCodes ?? []) {
                if (code.id.endsWith('_script_section')) {
                    return {
                        code,
                        extension: '.tsx',
                        scriptKind: 4 // TSX
                    };
                }
            }
            return undefined;
        }
    }
};

function createSectionSnapshot(snapshot: ts.IScriptSnapshot, start: number, end: number): ts.IScriptSnapshot {
    const length = end - start;
    return {
        getText(s: number, e: number): string {
            const actualStart = start + s;
            const actualEnd = start + Math.min(e, length);
            return snapshot.getText(actualStart, actualEnd);
        },
        getLength(): number {
            return length;
        },
        getChangeRange(): ts.TextChangeRange | undefined {
            return undefined;
        }
    };
}

class RsxVirtualCode implements VirtualCode {
    languageId = 'rsx';
    id: string;
    embeddedCodes: VirtualCode[] = [];
    mappings: CodeMapping[] = [];

    private rsxParser: RSXParser;
    private parseResult: RSXFile | null = null;

    constructor(
        public uri: URI,
        public snapshot: ts.IScriptSnapshot
    ) {
        this.id = uri.toString();
        this.rsxParser = new RSXParser();
        logger.debug('Creating virtual code', { uri: this.id });
        this.parse();
    }

    update(newSnapshot: ts.IScriptSnapshot) {
        this.snapshot = newSnapshot;
        this.embeddedCodes = [];
        this.mappings = [];
        logger.debug('Updating virtual code', { uri: this.id });
        this.parse();
    }

    private parse() {
        const content = this.snapshot.getText(0, this.snapshot.getLength());

        try {
            this.parseResult = this.rsxParser.parse(content);

            logger.debug('Parsed RSX file', {
                uri: this.id,
                sections: this.parseResult.sections.length,
                errors: this.parseResult.errors.length
            });

            for (const section of this.parseResult.sections) {
                this.processSection(section, content);
            }

            this.addRootMapping(content.length);
        } catch (err) {
            logger.error('Parse error', { uri: this.id, error: String(err) });
        }
    }

    private processSection(section: ParsedSection | TemplateSection, _content: string) {
        switch (section.type) {
            case 'script_section':
                this.addScriptSection(section);
                break;
            case 'template_section':
                this.addTemplateSection(section);
                break;
            case 'style_section':
                this.addStyleSection(section);
                break;
            case 'rust_section':
                this.addRustSection(section);
                break;
        }
    }

    private addScriptSection(section: ParsedSection | TemplateSection) {
        const contentStart = this.findContentStart(section, '<script>');
        const contentEnd = this.findContentEnd(section, '</script>');

        if (contentStart >= contentEnd) return;

        const virtualCode: VirtualCode = {
            id: `${this.id}_script_section`,
            languageId: 'typescript',
            snapshot: createSectionSnapshot(this.snapshot, contentStart, contentEnd),
            mappings: [
                {
                    sourceOffsets: [contentStart],
                    generatedOffsets: [0],
                    lengths: [contentEnd - contentStart],
                    data: FULL_FEATURES
                }
            ]
        };

        this.embeddedCodes.push(virtualCode);
    }

    private addTemplateSection(section: ParsedSection | TemplateSection) {
        const contentStart = this.findContentStart(section, '<template>');
        const contentEnd = this.findContentEnd(section, '</template>');

        if (contentStart >= contentEnd) return;

        const virtualCode: VirtualCode = {
            id: `${this.id}_template_section`,
            languageId: 'html',
            snapshot: createSectionSnapshot(this.snapshot, contentStart, contentEnd),
            mappings: [
                {
                    sourceOffsets: [contentStart],
                    generatedOffsets: [0],
                    lengths: [contentEnd - contentStart],
                    data: {
                        completion: true,
                        navigation: true,
                        structure: true,
                        format: true
                    }
                }
            ]
        };

        this.embeddedCodes.push(virtualCode);
    }

    private addStyleSection(section: ParsedSection | TemplateSection) {
        const contentStart = this.findContentStart(section, '<style>');
        const contentEnd = this.findContentEnd(section, '</style>');

        if (contentStart >= contentEnd) return;

        const virtualCode: VirtualCode = {
            id: `${this.id}_style_section`,
            languageId: 'css',
            snapshot: createSectionSnapshot(this.snapshot, contentStart, contentEnd),
            mappings: [
                {
                    sourceOffsets: [contentStart],
                    generatedOffsets: [0],
                    lengths: [contentEnd - contentStart],
                    data: FULL_FEATURES
                }
            ]
        };

        this.embeddedCodes.push(virtualCode);
    }

    private addRustSection(section: ParsedSection | TemplateSection) {
        const content = this.snapshot.getText(section.start, section.end);
        const firstDelimiter = content.indexOf('---');
        const secondDelimiter = content.indexOf('---', firstDelimiter + 3);

        if (firstDelimiter === -1 || secondDelimiter === -1) return;

        const contentStart = section.start + firstDelimiter + 3;
        const contentEnd = section.start + secondDelimiter;

        let rustContent = this.snapshot.getText(contentStart, contentEnd);
        if (rustContent.startsWith('\n')) {
            rustContent = rustContent.slice(1);
        }

        const virtualCode: VirtualCode = {
            id: `${this.id}_rust_section`,
            languageId: 'rust',
            snapshot: {
                getText: (s, e) => rustContent.substring(s, e),
                getLength: () => rustContent.length,
                getChangeRange: () => undefined
            },
            mappings: [
                {
                    sourceOffsets: [contentStart],
                    generatedOffsets: [0],
                    lengths: [rustContent.length],
                    data: {
                        completion: true,
                        navigation: true,
                        structure: true
                    }
                }
            ]
        };

        this.embeddedCodes.push(virtualCode);
    }

    private findContentStart(section: ParsedSection | TemplateSection, tag: string): number {
        const content = this.snapshot.getText(section.start, section.end);
        const tagIndex = content.indexOf(tag);
        if (tagIndex === -1) return section.start;

        let start = section.start + tagIndex + tag.length;
        const afterTag = this.snapshot.getText(start, start + 1);
        if (afterTag === '\n') {
            start++;
        }
        return start;
    }

    private findContentEnd(section: ParsedSection | TemplateSection, tag: string): number {
        const content = this.snapshot.getText(section.start, section.end);
        const tagIndex = content.lastIndexOf(tag);
        if (tagIndex === -1) return section.end;
        return section.start + tagIndex;
    }

    private addRootMapping(length: number) {
        this.mappings.push({
            sourceOffsets: [0],
            generatedOffsets: [0],
            lengths: [length],
            data: {
                verification: true,
                completion: true,
                semantic: true,
                navigation: true,
                structure: true,
                format: true
            }
        });
    }

    getParseResult(): RSXFile | null {
        return this.parseResult;
    }
}
