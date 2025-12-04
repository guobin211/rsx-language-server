# 测试快速开始指南

## 🚀 快速运行

### 1. 运行所有测试
```bash
npm test
```

### 2. 查看测试摘要
```bash
npm run test:summary
```

### 3. 监听模式（自动重新运行）
```bash
npm run test:watch
```

### 4. 运行单个测试文件
```bash
# 方法 1: 使用脚本
./run-tests.sh 1  # 运行 01-initialization.test.js
./run-tests.sh 2  # 运行 02-completion.test.js

# 方法 2: 直接使用 node
node --test tests/01-initialization.test.js
```

## 📋 测试文件说明

| 文件 | 测试内容 | 测试数量 |
|------|---------|---------|
| `01-initialization.test.js` | LSP 服务器初始化、能力检测 | 10 个测试 |
| `02-completion.test.js` | 代码补全功能（指令、区块） | 8 个测试 |
| `03-hover.test.js` | 悬停提示文档 | 7 个测试 |
| `04-document-parsing.test.js` | 文档解析和更新 | 9 个测试 |
| `05-typescript-integration.test.js` | TypeScript 集成 | 8 个测试 |
| `06-error-handling.test.js` | 错误处理和恢复 | 11 个测试 |

**总计：53+ 个测试用例**

## 🎯 测试覆盖的功能

### ✅ 核心 LSP 功能
- [x] 初始化和能力协商
- [x] 文本文档同步
- [x] 代码补全
- [x] 悬停提示
- [x] 定义跳转
- [x] 引用查找
- [x] 文档符号
- [x] 代码格式化
- [x] 语义标记

### ✅ RSX 特性
- [x] RSX 指令 (`@if`, `@each`, `@html`)
- [x] 条件分支 (`:else`, `:else if`)
- [x] 插值表达式 (`{{}}`)
- [x] 区块解析 (`<script>`, `<template>`, `<style>`, `---`)
- [x] Rust frontmatter
- [x] TypeScript 集成

### ✅ 错误处理
- [x] 语法错误
- [x] 格式错误
- [x] 大文档处理
- [x] 快速更新
- [x] 错误恢复

## 🔧 调试测试

### 查看详细输出
```bash
node --test tests/01-initialization.test.js
```

### 使用调试器
```bash
node --inspect-brk --test tests/02-completion.test.js
```

然后在 Chrome 打开 `chrome://inspect` 连接调试器。

### 增加日志输出
在测试文件中取消注释 `console.log` 语句：

```javascript
test('your test', async () => {
    const result = await client.completion(testFileUri, position);
    console.log('Completion result:', JSON.stringify(result, null, 2));
    // ...
});
```

## 📊 理解测试输出

### TAP 格式输出
```
TAP version 13
# Subtest: LSP Server Initialization
    # Subtest: should initialize successfully
    ok 1 - should initialize successfully
      ---
      duration_ms: 146.069166
      type: 'test'
      ...
```

- `ok N` - 测试通过
- `not ok N` - 测试失败
- `duration_ms` - 测试运行时间（毫秒）

### 测试摘要输出
```
🧪 RSX Language Server Test Suite

============================================================

Running LSP Server Initialization... ✅ (10/10)
Running Code Completion Features... ✅ (8/8)
...

🎯 Overall: 53/53 tests passed (100.0%)

🎉 All tests passed!
```

## 🐛 常见问题

### 测试超时
如果测试超时，增加等待时间：
```javascript
await new Promise(resolve => setTimeout(resolve, 200)); // 增加到 200ms
```

### LSP 服务器未响应
1. 检查服务器是否正确构建：`npm run build`
2. 检查 `bin/rsx-language-server.js` 是否存在
3. 查看错误日志

### 测试失败但手动测试正常
1. 确保测试文件 URI 使用正确格式：`file:///test/file.rsx`
2. 在操作后添加足够的等待时间
3. 检查文档版本号是否递增

## 📝 编写新测试

### 基本模板
```javascript
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { LSPClient } = require('./helpers/lsp-client.js');

describe('Your Test Suite', () => {
    let client;
    const serverPath = path.join(__dirname, '..', 'bin', 'rsx-language-server.js');
    const testFileUri = 'file:///test/your-test.rsx';

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

    test('should do something', async () => {
        const content = '<template><div>Test</div></template>';
        client.openDocument(testFileUri, 'rsx', 1, content);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Your test assertions
        assert.ok(true);
    });
});
```

### 最佳实践
1. ✅ 使用描述性的测试名称
2. ✅ 每个测试独立运行
3. ✅ 清理测试资源（`after` 钩子）
4. ✅ 添加适当的等待时间
5. ✅ 使用清晰的断言消息

## 🔄 持续集成

测试已配置为在 GitHub Actions 中自动运行：

```yaml
# .github/workflows/test.yml
- run: npm run build
- run: npm test
```

每次推送或 PR 都会自动运行所有测试。

## 📚 更多信息

- 查看 [README.md](./README.md) 了解完整文档
- 查看 [helpers/lsp-client.js](./helpers/lsp-client.js) 了解 LSP 客户端 API
- 查看现有测试文件了解更多示例

## 💡 提示

1. **快速迭代**：使用 `npm run test:watch` 在修改代码时自动运行测试
2. **聚焦测试**：只运行你正在修改的测试文件
3. **查看输出**：使用 `npm run test:summary` 查看友好的测试摘要
4. **调试问题**：添加 `console.log` 查看 LSP 消息细节

---

Happy Testing! 🎉
