import type {
    LanguageServicePlugin,
    LanguageServicePluginInstance,
    LanguageServiceContext
} from '@volar/language-service';
import { CompletionItemKind, InsertTextFormat, MarkupKind } from 'vscode-languageserver';
import type { CompletionItem, Hover } from 'vscode-languageserver';

const RSX_DIRECTIVES: Array<{
    label: string;
    detail: string;
    insertText: string;
    documentation: string;
}> = [
    {
        label: '{{@if}}',
        detail: '条件渲染',
        insertText: '{{@if ${1:condition}}}\n\t$0\n{{/if}}',
        documentation: '根据条件渲染内容\n\n```rsx\n{{@if condition}}\n  content\n{{/if}}\n```'
    },
    {
        label: '{{@each}}',
        detail: '列表渲染',
        insertText: '{{@each ${1:items} as ${2:item}}}\n\t$0\n{{/each}}',
        documentation: '遍历数组渲染列表\n\n```rsx\n{{@each items as item, index}}\n  {{item}}\n{{/each}}\n```'
    },
    {
        label: '{{@html}}',
        detail: '原始HTML',
        insertText: '{{@html ${1:content}}}',
        documentation: '输出原始HTML内容\n\n⚠️ 注意安全性，避免XSS攻击\n\n```rsx\n{{@html rawContent}}\n```'
    },
    {
        label: '{{:else}}',
        detail: 'else分支',
        insertText: '{{:else}}',
        documentation: '条件不满足时的分支\n\n```rsx\n{{@if condition}}\n  ...\n{{:else}}\n  ...\n{{/if}}\n```'
    },
    {
        label: '{{:else if}}',
        detail: 'else if分支',
        insertText: '{{:else if ${1:condition}}}',
        documentation:
            'else if 条件分支\n\n```rsx\n{{@if condition1}}\n  ...\n{{:else if condition2}}\n  ...\n{{/if}}\n```'
    },
    {
        label: '{{/if}}',
        detail: '结束if',
        insertText: '{{/if}}',
        documentation: '结束条件渲染块'
    },
    {
        label: '{{/each}}',
        detail: '结束each',
        insertText: '{{/each}}',
        documentation: '结束列表渲染块'
    },
    {
        label: '{{}}',
        detail: '插值表达式',
        insertText: '{{${1:expression}}}',
        documentation: '输出表达式的值\n\n```rsx\n{{variable}}\n{{obj.property}}\n{{func(arg)}}\n```'
    }
];

const RSX_SECTIONS: Array<{
    label: string;
    detail: string;
    insertText: string;
    documentation: string;
}> = [
    {
        label: '---',
        detail: 'Rust frontmatter',
        insertText: '---\n${1:// Rust code}\n---',
        documentation:
            'Rust 代码区块\n\n```rsx\n---\nuse rsx::prelude::*;\n\npub async fn handler() -> impl IntoResponse {\n    // ...\n}\n---\n```'
    },
    {
        label: '<script>',
        detail: 'Script section',
        insertText: '<script>\n${1:// TypeScript code}\n</script>',
        documentation: 'TypeScript 脚本区块\n\n```rsx\n<script>\nexport const data = { ... };\n</script>\n```'
    },
    {
        label: '<template>',
        detail: 'Template section',
        insertText: '<template>\n\t$0\n</template>',
        documentation:
            'HTML 模板区块\n\n```rsx\n<template>\n  <div class="container">\n    ...\n  </div>\n</template>\n```'
    },
    {
        label: '<style>',
        detail: 'Style section',
        insertText: '<style>\n${1:/* CSS/SCSS */}\n</style>',
        documentation: 'CSS/SCSS 样式区块\n\n```rsx\n<style>\n.container {\n  display: flex;\n}\n</style>\n```'
    }
];

export function createRsxService(): LanguageServicePlugin {
    return {
        name: 'rsx',
        capabilities: {
            completionProvider: {
                triggerCharacters: ['{', '@', '#', ':', '<', '-']
            },
            hoverProvider: true
        },
        create(_context: LanguageServiceContext): LanguageServicePluginInstance {
            return {
                provideCompletionItems(document, position, _completionContext, _token) {
                    if (!document.uri.endsWith('.rsx')) {
                        return null;
                    }

                    const text = document.getText();
                    const offset = document.offsetAt(position);
                    const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
                    const lineText = text.substring(lineStart, offset);
                    const charBefore = text.charAt(offset - 1);
                    const twoCharsBefore = text.substring(Math.max(0, offset - 2), offset);

                    const items: CompletionItem[] = [];

                    if (twoCharsBefore === '{{' || charBefore === '{') {
                        for (const directive of RSX_DIRECTIVES) {
                            items.push({
                                label: directive.label,
                                kind: CompletionItemKind.Snippet,
                                detail: directive.detail,
                                insertText: directive.insertText,
                                insertTextFormat: InsertTextFormat.Snippet,
                                documentation: {
                                    kind: MarkupKind.Markdown,
                                    value: directive.documentation
                                }
                            });
                        }
                    }

                    const trimmedLine = lineText.trim();
                    if (trimmedLine === '' || trimmedLine === '<' || trimmedLine === '-' || trimmedLine === '--') {
                        for (const section of RSX_SECTIONS) {
                            items.push({
                                label: section.label,
                                kind: CompletionItemKind.Snippet,
                                detail: section.detail,
                                insertText: section.insertText,
                                insertTextFormat: InsertTextFormat.Snippet,
                                documentation: {
                                    kind: MarkupKind.Markdown,
                                    value: section.documentation
                                }
                            });
                        }
                    }

                    if (items.length === 0) {
                        return null;
                    }

                    return {
                        isIncomplete: false,
                        items
                    };
                },

                provideHover(document, position, _token): Hover | null {
                    if (!document.uri.endsWith('.rsx')) {
                        return null;
                    }

                    const text = document.getText();
                    const offset = document.offsetAt(position);
                    const range = 30;
                    const start = Math.max(0, offset - range);
                    const end = Math.min(text.length, offset + range);
                    const context = text.substring(start, end);

                    const hoverDocs: Record<string, string> = {
                        '{{@if':
                            '**条件渲染指令**\n\n根据条件决定是否渲染内容\n\n```rsx\n{{@if condition}}\n  content\n{{:else if otherCondition}}\n  other content\n{{:else}}\n  fallback\n{{/if}}\n```',
                        '{{@each':
                            '**列表渲染指令**\n\n遍历数组渲染列表项\n\n```rsx\n{{@each items as item, index}}\n  <div>{{index}}: {{item.name}}</div>\n{{/each}}\n```',
                        '{{@html':
                            '**原始HTML指令**\n\n直接输出HTML内容，不进行转义\n\n⚠️ **安全警告**: 确保内容可信，避免XSS攻击\n\n```rsx\n{{@html rawHtmlContent}}\n```',
                        '{{:else}}': '**else 分支**\n\n当条件不满足时执行的分支',
                        '{{:else if': '**else if 分支**\n\n额外的条件判断分支',
                        '{{/if}}': '**结束 if 块**',
                        '{{/each}}': '**结束 each 块**',
                        '<script>': '**Script 区块**\n\nTypeScript/JavaScript 代码区域\n\n支持导出数据供模板使用',
                        '</script>': '**Script 区块结束标签**',
                        '<template>': '**Template 区块**\n\nHTML 模板区域\n\n支持 RSX 指令和插值表达式',
                        '</template>': '**Template 区块结束标签**',
                        '<style>': '**Style 区块**\n\nCSS/SCSS 样式区域',
                        '</style>': '**Style 区块结束标签**',
                        '---': '**Rust Frontmatter**\n\nRust 代码区域\n\n用于定义服务端逻辑'
                    };

                    for (const [pattern, doc] of Object.entries(hoverDocs)) {
                        if (context.includes(pattern)) {
                            return {
                                contents: {
                                    kind: MarkupKind.Markdown,
                                    value: doc
                                }
                            };
                        }
                    }

                    return null;
                }
            };
        }
    };
}
