# RSX Language Server 测试用例详细清单

## 目录
- [1. 初始化测试](#1-初始化测试)
- [2. 代码补全测试](#2-代码补全测试)
- [3. 悬停提示测试](#3-悬停提示测试)
- [4. 文档解析测试](#4-文档解析测试)
- [5. TypeScript 集成测试](#5-typescript-集成测试)
- [6. 错误处理测试](#6-错误处理测试)

---

## 1. 初始化测试
**文件**: `01-initialization.test.js`

### TC-INIT-001: 服务器初始化
- **描述**: 验证 LSP 服务器能够成功初始化
- **前置条件**: 服务器已构建
- **测试步骤**:
  1. 启动 LSP 服务器进程
  2. 发送 `initialize` 请求
  3. 发送 `initialized` 通知
- **预期结果**: 
  - 收到包含 capabilities 的响应
  - 服务器状态为已初始化

### TC-INIT-002: 文本文档同步支持
- **描述**: 验证服务器支持文本文档同步
- **测试步骤**: 检查 `capabilities.textDocumentSync`
- **预期结果**: `textDocumentSync` 为数字类型（2 = Incremental）

### TC-INIT-003: 代码补全支持
- **描述**: 验证服务器支持代码补全功能
- **测试步骤**: 检查 `capabilities.completionProvider`
- **预期结果**: 
  - `completionProvider` 存在
  - 包含触发字符数组
  - 触发字符包括: `{`, `@`, `<`, `-` 等

### TC-INIT-004: 悬停提示支持
- **描述**: 验证服务器支持悬停提示
- **测试步骤**: 检查 `capabilities.hoverProvider`
- **预期结果**: `hoverProvider` 为 `true`

### TC-INIT-005: 定义跳转支持
- **描述**: 验证服务器支持定义跳转
- **测试步骤**: 检查 `capabilities.definitionProvider`
- **预期结果**: `definitionProvider` 为 `true`

### TC-INIT-006: 引用查找支持
- **描述**: 验证服务器支持引用查找
- **测试步骤**: 检查 `capabilities.referencesProvider`
- **预期结果**: `referencesProvider` 为 `true`

### TC-INIT-007: 文档符号支持
- **描述**: 验证服务器支持文档符号
- **测试步骤**: 检查 `capabilities.documentSymbolProvider`
- **预期结果**: `documentSymbolProvider` 为 `true`

### TC-INIT-008: 文档格式化支持
- **描述**: 验证服务器支持代码格式化
- **测试步骤**: 检查格式化相关 capabilities
- **预期结果**: 
  - `documentFormattingProvider` 为 `true`
  - `documentRangeFormattingProvider` 为 `true`

### TC-INIT-009: 语义标记支持
- **描述**: 验证服务器支持语义标记
- **测试步骤**: 检查 `capabilities.semanticTokensProvider`
- **预期结果**: 
  - `semanticTokensProvider` 存在
  - 包含 `legend` 对象
  - `tokenTypes` 和 `tokenModifiers` 为数组

### TC-INIT-010: 工作区功能支持
- **描述**: 验证服务器支持工作区功能
- **测试步骤**: 检查 `capabilities.workspace`
- **预期结果**: 
  - `workspace` 对象存在
  - 支持工作区文件夹

---

## 2. 代码补全测试
**文件**: `02-completion.test.js`

### TC-COMP-001: RSX 指令补全
- **描述**: 在输入 `{{` 后提供 RSX 指令补全
- **测试输入**: 
  ```rsx
  <template>
      {{
  </template>
  ```
- **光标位置**: `{` 之后
- **预期结果**: 
  - 返回补全列表
  - 包含 `{{@if}}`、`{{@each}}`、`{{@html}}` 等

### TC-COMP-002: 文档开始区块补全
- **描述**: 在文档开始位置提供区块补全
- **测试输入**: 空行或新行
- **预期结果**: 
  - 包含 `<script>`、`<template>`、`<style>`
  - 包含 `---`（Rust frontmatter）

### TC-COMP-003: @if 指令补全
- **描述**: 提供完整的 @if 指令补全
- **测试输入**: `{{@`
- **预期结果**: 
  - 找到 `{{@if}}` 补全项
  - 包含详细说明
  - insertText 包含 `condition` 占位符
  - 包含 `{{/if}}` 闭合标签

### TC-COMP-004: @each 指令补全
- **描述**: 提供完整的 @each 指令补全
- **测试输入**: `{{@e`
- **预期结果**: 
  - 找到 `{{@each}}` 补全项
  - insertText 包含 `items as item` 模板
  - 包含 `{{/each}}` 闭合标签

### TC-COMP-005: @html 指令补全
- **描述**: 提供 @html 指令补全及安全警告
- **测试输入**: `{{@h`
- **预期结果**: 
  - 找到 `{{@html}}` 补全项
  - 文档包含安全警告（XSS）

### TC-COMP-006: script 区块补全
- **描述**: 提供 script 区块补全
- **测试输入**: 新行
- **预期结果**: 
  - 找到 `<script>` 补全项
  - 包含闭合标签 `</script>`
  - 使用 snippet 格式

### TC-COMP-007: template 区块补全
- **描述**: 提供 template 区块补全
- **测试输入**: 新行
- **预期结果**: 
  - 找到 `<template>` 补全项
  - 包含闭合标签 `</template>`

### TC-COMP-008: 补全项文档格式
- **描述**: 验证补全项包含正确的文档格式
- **预期结果**: 
  - 使用 Markdown 格式
  - 包含代码示例
  - 包含用法说明

---

## 3. 悬停提示测试
**文件**: `03-hover.test.js`

### TC-HOVER-001: @if 指令悬停
- **描述**: 在 @if 指令上提供悬停文档
- **测试输入**: 
  ```rsx
  {{@if condition}}
  ```
- **光标位置**: `@if` 上
- **预期结果**: 
  - 返回悬停信息
  - 包含条件渲染说明
  - 包含使用示例

### TC-HOVER-002: @each 指令悬停
- **描述**: 在 @each 指令上提供悬停文档
- **测试输入**: 
  ```rsx
  {{@each items as item}}
  ```
- **光标位置**: `@each` 上
- **预期结果**: 
  - 返回悬停信息
  - 包含列表渲染说明
  - 包含使用示例

### TC-HOVER-003: @html 指令悬停
- **描述**: 在 @html 指令上提供悬停文档及安全警告
- **测试输入**: 
  ```rsx
  {{@html rawContent}}
  ```
- **光标位置**: `@html` 上
- **预期结果**: 
  - 返回悬停信息
  - 包含 XSS 安全警告
  - 包含 ⚠️ 警告图标

### TC-HOVER-004: script 标签悬停
- **描述**: 在 script 标签上提供说明
- **测试输入**: `<script>`
- **光标位置**: `script` 上
- **预期结果**: 
  - 包含 Script 区块说明
  - 说明 TypeScript 支持

### TC-HOVER-005: template 标签悬停
- **描述**: 在 template 标签上提供说明
- **测试输入**: `<template>`
- **光标位置**: `template` 上
- **预期结果**: 
  - 包含 Template 区块说明
  - 说明 HTML 模板功能

### TC-HOVER-006: style 标签悬停
- **描述**: 在 style 标签上提供说明
- **测试输入**: `<style>`
- **光标位置**: `style` 上
- **预期结果**: 
  - 包含 Style 区块说明
  - 说明 CSS/SCSS 支持

### TC-HOVER-007: Rust frontmatter 悬停
- **描述**: 在 Rust frontmatter 分隔符上提供说明
- **测试输入**: `---`
- **光标位置**: 分隔符上
- **预期结果**: 
  - 包含 Rust Frontmatter 说明
  - 说明服务端逻辑用途

---

## 4. 文档解析测试
**文件**: `04-document-parsing.test.js`

### TC-PARSE-001: 完整文档解析
- **描述**: 解析包含所有区块的完整 RSX 文档
- **测试输入**: `fixtures/sample.rsx`
- **预期结果**: 
  - 文档成功解析
  - 无崩溃错误
  - 可查询文档符号

### TC-PARSE-002: 仅 script 区块
- **描述**: 解析仅包含 script 区块的文档
- **测试输入**: 
  ```rsx
  <script>
  export const name = "test";
  </script>
  ```
- **预期结果**: 文档正常解析

### TC-PARSE-003: 仅 template 区块
- **描述**: 解析仅包含 template 区块的文档
- **测试输入**: 
  ```rsx
  <template>
      <div>Hello</div>
  </template>
  ```
- **预期结果**: 文档正常解析

### TC-PARSE-004: 仅 style 区块
- **描述**: 解析仅包含 style 区块的文档
- **测试输入**: 
  ```rsx
  <style>
  .container { display: flex; }
  </style>
  ```
- **预期结果**: 文档正常解析

### TC-PARSE-005: Rust frontmatter 解析
- **描述**: 解析包含 Rust frontmatter 的文档
- **测试输入**: 
  ```rsx
  ---
  use rsx::prelude::*;
  ---
  <template></template>
  ```
- **预期结果**: 文档正常解析

### TC-PARSE-006: 文档更新
- **描述**: 处理文档内容更新
- **测试步骤**:
  1. 打开文档
  2. 发送更新通知
- **预期结果**: 更新成功处理

### TC-PARSE-007: 空文档
- **描述**: 处理空文档
- **测试输入**: 空字符串
- **预期结果**: 无错误

### TC-PARSE-008: 语法错误文档
- **描述**: 处理包含语法错误的文档
- **测试输入**: 
  ```rsx
  <template>
      {{@if}}
  </template>
  ```
- **预期结果**: 服务器不崩溃

### TC-PARSE-009: 混合区块文档
- **描述**: 解析包含所有类型区块的文档
- **测试输入**: Rust + Script + Template + Style
- **预期结果**: 所有区块正确解析

---

## 5. TypeScript 集成测试
**文件**: `05-typescript-integration.test.js`

### TC-TS-001: TypeScript 基本支持
- **描述**: 验证 TypeScript 语法支持
- **测试输入**: 
  ```typescript
  interface User {
      id: number;
      name: string;
  }
  ```
- **预期结果**: 正确解析 TypeScript

### TC-TS-002: 类型信息提供
- **描述**: 提供类型信息
- **测试输入**: 
  ```typescript
  function add(a: number, b: number): number {
      return a + b;
  }
  ```
- **预期结果**: 可获取类型信息

### TC-TS-003: 导入语句处理
- **描述**: 处理 ES6 导入
- **测试输入**: 
  ```typescript
  import { useState } from 'react';
  ```
- **预期结果**: 正确处理导入

### TC-TS-004: 泛型类型
- **描述**: 支持泛型类型
- **测试输入**: 
  ```typescript
  interface Response<T> {
      data: T;
  }
  ```
- **预期结果**: 正确解析泛型

### TC-TS-005: async/await
- **描述**: 支持异步语法
- **测试输入**: 
  ```typescript
  async function fetchData(): Promise<any> {
      return await fetch('/api');
  }
  ```
- **预期结果**: 正确解析异步函数

### TC-TS-006: 枚举声明
- **描述**: 支持枚举
- **测试输入**: 
  ```typescript
  enum Status {
      Active = 'active',
      Inactive = 'inactive'
  }
  ```
- **预期结果**: 正确解析枚举

### TC-TS-007: 类声明
- **描述**: 支持类
- **测试输入**: 
  ```typescript
  class UserService {
      async getUser(id: number) { }
  }
  ```
- **预期结果**: 正确解析类

### TC-TS-008: 装饰器
- **描述**: 支持装饰器语法
- **测试输入**: 
  ```typescript
  class Model {
      @readonly
      id: number;
  }
  ```
- **预期结果**: 正确解析装饰器

---

## 6. 错误处理测试
**文件**: `06-error-handling.test.js`

### TC-ERR-001: 格式错误请求
- **描述**: 处理格式错误的 JSON-RPC 请求
- **预期结果**: 服务器不崩溃

### TC-ERR-002: 未闭合标签
- **描述**: 处理 HTML 未闭合标签
- **测试输入**: 
  ```rsx
  <template>
      <div>
          <p>Hello
      </div>
  </template>
  ```
- **预期结果**: 服务器继续运行

### TC-ERR-003: 缺失闭合指令
- **描述**: 处理缺失 `{{/if}}` 等闭合标签
- **测试输入**: 
  ```rsx
  {{@if condition}}
      <div>Content</div>
  ```
- **预期结果**: 服务器不崩溃

### TC-ERR-004: 无效 TypeScript 语法
- **描述**: 处理无效的 TypeScript 代码
- **测试输入**: 
  ```typescript
  export const x = ;
  ```
- **预期结果**: 服务器继续运行

### TC-ERR-005: 超大文档
- **描述**: 处理非常大的文档
- **测试输入**: 1000+ 行的 HTML
- **预期结果**: 正常处理

### TC-ERR-006: 快速更新
- **描述**: 处理快速连续的文档更新
- **测试步骤**: 连续发送 10 次更新
- **预期结果**: 所有更新正确处理

### TC-ERR-007: 无效 URI
- **描述**: 处理无效的文件 URI
- **测试输入**: `not-a-valid-uri`
- **预期结果**: 优雅地拒绝或忽略

### TC-ERR-008: 不存在的文档
- **描述**: 查询不存在的文档
- **测试步骤**: 请求未打开文档的补全
- **预期结果**: 返回 null 或错误

### TC-ERR-009: 格式错误指令
- **描述**: 处理格式错误的 RSX 指令
- **测试输入**: 
  ```rsx
  {{@if}}
  {{@each}}
  ```
- **预期结果**: 服务器不崩溃

### TC-ERR-010: 深度嵌套指令
- **描述**: 处理深度嵌套的指令
- **测试输入**: 5 层嵌套的 `{{@if}}`
- **预期结果**: 正确处理

### TC-ERR-011: 错误后恢复
- **描述**: 验证错误处理后服务器恢复正常
- **测试步骤**:
  1. 触发错误
  2. 发送正常请求
- **预期结果**: 正常请求成功处理

---

## 测试统计

| 类别 | 测试数量 | 优先级 |
|------|---------|--------|
| 初始化 | 10 | P0 (关键) |
| 代码补全 | 8 | P0 (关键) |
| 悬停提示 | 7 | P1 (重要) |
| 文档解析 | 9 | P0 (关键) |
| TypeScript 集成 | 8 | P1 (重要) |
| 错误处理 | 11 | P0 (关键) |
| **总计** | **53** | - |

## 测试优先级

- **P0 (关键)**: 核心功能，必须通过
- **P1 (重要)**: 重要功能，应该通过
- **P2 (一般)**: 增强功能，可以延后

## 测试覆盖率目标

- ✅ 行覆盖率: > 80%
- ✅ 分支覆盖率: > 70%
- ✅ 函数覆盖率: > 85%
- ✅ 语句覆盖率: > 80%

---

*最后更新: 2024-12-04*
