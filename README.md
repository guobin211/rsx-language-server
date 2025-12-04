# rsx-language-server

## Description

This package provides a language server for the rsx language.

## Task

### 语言解析

- 使用valor开发rsx语言的lsp服务
- ast解析采用tree-sitter-rsx
- html部分使用volar-service-html
- script部分使用volar-service-typescript
- style部分采用volar-service-css

### 代码格式化

- 缩进采用4个空格，换行采用unix换行符

### tree-sitter-rsx

[tree-sitter-rsx](https://github.com/guobin211/tree-sitter-rsx)
