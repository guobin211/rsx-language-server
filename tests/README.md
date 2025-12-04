# RSX Language Server Tests

完整的 LSP Server 测试套件，使用 Node.js 内置的 test runner。

## 测试结构

```
tests/
├── helpers/
│   └── lsp-client.js          # LSP 客户端辅助工具
├── fixtures/
│   └── sample.rsx             # 测试样本文件
├── 01-initialization.test.js  # 初始化测试
├── 02-completion.test.js      # 代码补全测试
├── 03-hover.test.js           # 悬停提示测试
├── 04-document-parsing.test.js # 文档解析测试
├── 05-typescript-integration.test.js # TypeScript 集成测试
└── 06-error-handling.test.js  # 错误处理测试
```

## 运行测试

### 运行所有测试
```bash
npm test
```

### 监听模式
```bash
npm run test:watch
```

### 运行单个测试文件
```bash
node --test tests/01-initialization.test.js
```

### 运行特定测试套件
```bash
node --test tests/02-completion.test.js
```

## 测试覆盖范围

### 1. 初始化测试 (01-initialization.test.js)
- ✅ LSP 服务器成功初始化
- ✅ 文本文档同步支持
- ✅ 代码补全支持
- ✅ 悬停提示支持
- ✅ 定义跳转支持
- ✅ 引用查找支持
- ✅ 文档符号支持
- ✅ 代码格式化支持
- ✅ 语义标记支持
- ✅ 工作区功能支持

### 2. 代码补全测试 (02-completion.test.js)
- ✅ RSX 指令补全 (`{{@if}}`, `{{@each}}`, `{{@html}}`)
- ✅ 区块补全 (`<script>`, `<template>`, `<style>`, `---`)
- ✅ 条件分支补全 (`{{:else}}`, `{{:else if}}`)
- ✅ 插值表达式补全
- ✅ 补全项文档和详情
- ✅ Snippet 支持

### 3. 悬停提示测试 (03-hover.test.js)
- ✅ `{{@if}}` 指令悬停文档
- ✅ `{{@each}}` 指令悬停文档
- ✅ `{{@html}}` 指令悬停文档（包含安全警告）
- ✅ `<script>` 标签悬停说明
- ✅ `<template>` 标签悬停说明
- ✅ `<style>` 标签悬停说明
- ✅ Rust frontmatter 悬停说明

### 4. 文档解析测试 (04-document-parsing.test.js)
- ✅ 完整 RSX 文档解析
- ✅ 仅 script 区块文档
- ✅ 仅 template 区块文档
- ✅ 仅 style 区块文档
- ✅ 带 Rust frontmatter 的文档
- ✅ 文档更新处理
- ✅ 空文档处理
- ✅ 语法错误文档处理
- ✅ 混合区块文档解析

### 5. TypeScript 集成测试 (05-typescript-integration.test.js)
- ✅ TypeScript 语法支持
- ✅ 类型信息提供
- ✅ 导入语句处理
- ✅ 泛型类型支持
- ✅ async/await 语法
- ✅ 枚举声明
- ✅ 类声明
- ✅ 装饰器支持

### 6. 错误处理测试 (06-error-handling.test.js)
- ✅ 格式错误的请求处理
- ✅ 未闭合标签处理
- ✅ 缺失闭合指令处理
- ✅ 无效 TypeScript 语法
- ✅ 超大文档处理
- ✅ 快速文档更新
- ✅ 无效文件 URI
- ✅ 不存在文档请求
- ✅ 格式错误的 RSX 指令
- ✅ 嵌套指令处理
- ✅ 错误后恢复

## LSP 客户端工具

`helpers/lsp-client.js` 提供了一个完整的 LSP 客户端实现，包括：

### 核心功能
- `start()` - 启动 LSP 服务器
- `initialize(rootUri)` - 初始化 LSP 连接
- `shutdown()` - 关闭 LSP 服务器

### 文档操作
- `openDocument(uri, languageId, version, text)` - 打开文档
- `changeDocument(uri, version, changes)` - 修改文档

### LSP 功能
- `completion(uri, position)` - 请求代码补全
- `hover(uri, position)` - 请求悬停信息
- `definition(uri, position)` - 请求定义跳转
- `documentSymbols(uri)` - 请求文档符号
- `formatting(uri, options)` - 请求格式化

### 底层通信
- `sendRequest(method, params)` - 发送 LSP 请求
- `sendNotification(method, params)` - 发送 LSP 通知
- `handleData(data)` - 处理服务器响应

## 编写新测试

### 测试模板

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

    test('your test case', async () => {
        const content = `<template>\n    <div>Test</div>\n</template>`;
        
        client.openDocument(testFileUri, 'rsx', 1, content);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Your test logic here
        assert.ok(true, 'Test passed');
    });
});
```

## 最佳实践

1. **等待处理时间**: 在发送请求后使用 `setTimeout` 等待服务器处理
2. **清理资源**: 始终在 `after` 钩子中关闭客户端
3. **错误处理**: 使用 try-catch 处理可能失败的请求
4. **断言清晰**: 使用描述性的断言消息
5. **独立测试**: 每个测试应该独立运行，不依赖其他测试的状态

## 调试测试

### 查看详细输出
```bash
node --test tests/01-initialization.test.js
```

### 调试特定测试
```bash
node --inspect-brk --test tests/02-completion.test.js
```

### 查看 LSP 通信
在测试中取消注释 `console.log` 语句以查看详细的 LSP 消息。

## CI/CD 集成

这些测试可以轻松集成到 CI/CD 管道中：

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: npm run build
      - run: npm test
```

## 贡献

添加新测试时，请确保：
1. 测试覆盖新功能或边界情况
2. 测试能够独立运行
3. 添加适当的文档说明
4. 更新本 README 的测试覆盖范围部分
