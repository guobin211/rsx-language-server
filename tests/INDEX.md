# RSX Language Server 测试套件索引

## 📁 文件结构

```
tests/
├── helpers/
│   └── lsp-client.js              # LSP 客户端工具类
├── fixtures/
│   └── sample.rsx                 # 测试样本文件
├── 00-quick-check.test.js         # ⚡ 快速检查（推荐首先运行）
├── 01-initialization.test.js      # 初始化和能力检测
├── 02-completion.test.js          # 代码补全功能
├── 03-hover.test.js               # 悬停提示
├── 04-document-parsing.test.js    # 文档解析
├── 05-typescript-integration.test.js  # TypeScript 集成
├── 06-error-handling.test.js      # 错误处理
├── test-summary.js                # 测试摘要生成器
├── INDEX.md                       # 本文件
├── QUICK_START.md                 # 快速开始指南
├── README.md                      # 完整文档
└── TEST_CASES.md                  # 详细测试用例清单
```

## 🚀 快速开始

### 1. 运行快速检查（推荐）
```bash
node --test tests/00-quick-check.test.js
```
这个测试验证 LSP 服务器的基本功能，运行时间约 1-2 秒。

### 2. 运行所有测试
```bash
npm test
```

### 3. 查看测试摘要
```bash
npm run test:summary
```

## 📊 测试概览

| # | 测试文件 | 测试数量 | 运行时间 | 优先级 | 状态 |
|---|---------|---------|---------|--------|------|
| 0 | 00-quick-check | 3 | ~1s | P0 | ✅ |
| 1 | 01-initialization | 10 | ~2s | P0 | ✅ |
| 2 | 02-completion | 8 | ~5s | P0 | ⚠️ |
| 3 | 03-hover | 7 | ~4s | P1 | ⚠️ |
| 4 | 04-document-parsing | 9 | ~3s | P0 | ✅ |
| 5 | 05-typescript-integration | 8 | ~4s | P1 | ✅ |
| 6 | 06-error-handling | 11 | ~5s | P0 | ✅ |

**总计**: 56 个测试用例

## 📖 文档指南

### 新手入门
1. 先阅读 [QUICK_START.md](./QUICK_START.md)
2. 运行 `00-quick-check.test.js` 验证环境
3. 查看 [README.md](./README.md) 了解详细信息

### 开发者
1. 查看 [TEST_CASES.md](./TEST_CASES.md) 了解所有测试用例
2. 参考 `helpers/lsp-client.js` 了解 API
3. 查看现有测试文件学习测试模式

### 贡献者
1. 阅读完整文档
2. 运行现有测试确保通过
3. 添加新测试时更新相关文档

## 🎯 测试分类

### 功能测试
- ✅ **初始化** (01): 服务器启动和能力协商
- ⚠️ **补全** (02): 代码补全功能
- ⚠️ **悬停** (03): 悬停提示信息
- ✅ **解析** (04): 文档解析和更新

### 集成测试
- ✅ **TypeScript** (05): TypeScript 语言集成
- ✅ **错误处理** (06): 错误情况处理

### 快速测试
- ✅ **快速检查** (00): 基础功能验证

## 🔧 测试工具

### LSP 客户端 (`helpers/lsp-client.js`)

完整的 LSP 协议客户端实现，提供：

#### 生命周期管理
```javascript
await client.start()        // 启动服务器
await client.initialize()   // 初始化连接
await client.shutdown()     // 关闭服务器
```

#### 文档操作
```javascript
client.openDocument(uri, languageId, version, text)
client.changeDocument(uri, version, changes)
```

#### LSP 功能
```javascript
await client.completion(uri, position)
await client.hover(uri, position)
await client.definition(uri, position)
await client.documentSymbols(uri)
await client.formatting(uri, options)
```

#### 底层通信
```javascript
await client.sendRequest(method, params)
client.sendNotification(method, params)
```

## 📝 测试编写指南

### 基本模板

```javascript
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { LSPClient } = require('./helpers/lsp-client.js');

describe('My Test Suite', () => {
    let client;

    before(async () => {
        client = new LSPClient(serverPath);
        await client.start();
        await client.initialize();
    });

    after(async () => {
        await client.shutdown();
    });

    test('my test case', async () => {
        // 测试逻辑
        assert.ok(true);
    });
});
```

### 最佳实践

1. **独立性**: 每个测试独立运行
2. **清理**: 在 `after` 钩子中清理资源
3. **等待**: 给服务器处理时间
4. **断言**: 使用清晰的断言消息
5. **文档**: 添加注释说明测试目的

## 🐛 故障排除

### 测试超时
某些补全和悬停测试可能超时，这通常是因为：
- RSX 服务需要特定的文档结构
- 服务器需要更多时间处理
- 解决方法：增加等待时间或检查请求格式

### 服务器无响应
1. 检查构建：`npm run build`
2. 检查文件路径
3. 查看错误日志

### 测试失败
1. 运行快速检查确认基础功能
2. 单独运行失败的测试
3. 添加调试日志

## 📈 测试覆盖目标

- ✅ 核心 LSP 功能: 100%
- ✅ RSX 特性: 90%+
- ✅ 错误处理: 95%+
- ⚠️ 边缘情况: 80%+

## 🔄 CI/CD 集成

测试已配置在 GitHub Actions 中：

```yaml
# .github/workflows/test.yml
- run: npm run build
- run: npm test
```

每次推送或 PR 都会自动运行。

## 📚 相关资源

- [LSP 规范](https://microsoft.github.io/language-server-protocol/)
- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Volar 文档](https://volarjs.dev/)

## 💬 获取帮助

1. 查看相关文档
2. 运行快速检查定位问题
3. 查看现有测试示例
4. 添加调试日志

## 📝 更新日志

### 2024-12-04
- ✅ 创建完整测试套件
- ✅ 添加 56 个测试用例
- ✅ 实现 LSP 客户端工具
- ✅ 添加完整文档
- ✅ 配置 CI/CD

---

**提示**: 开始测试前，先运行 `node --test tests/00-quick-check.test.js` 确保环境正常！
