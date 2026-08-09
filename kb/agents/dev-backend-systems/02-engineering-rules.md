---
id: "kb-agents-dev-backend-systems-engineering-rules"
title: "Dev-Backend-Systems 工程规则"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Systems 工程规则

## 版本与构建约束

- 什么时候使用：修改 JDK、C++ 标准、编译选项、Maven、Gradle、CMake、Makefile。
- Codex 生成代码时要遵守：先确认项目版本；不得使用未启用语言特性；构建参数改变必须说明影响。

## 内存与资源安全

- 什么时候使用：C/C++ 指针、容器、文件、socket、锁、线程、Java IO 和连接池。
- Codex 生成代码时要遵守：C++ 优先 RAII；Java 资源使用 try-with-resources；不留下泄漏、悬垂指针或未释放锁。

## 并发安全

- 什么时候使用：线程、协程、锁、原子变量、线程池、共享状态、异步回调。
- Codex 生成代码时要遵守：共享状态必须有同步策略；锁顺序要明确；不得制造数据竞争或死锁风险。

## 异常与错误

- 什么时候使用：Java 异常、C++ 异常、错误码、系统调用、边界输入。
- Codex 生成代码时要遵守：异常不吞掉；错误路径有恢复或上抛策略；析构、释放和回滚不依赖隐式幸运路径。

## 性能与稳定性

- 什么时候使用：性能优化、缓存、批处理、锁粒度、算法替换、系统资源限制。
- Codex 生成代码时要遵守：优化必须有可解释验证；不要为性能绕过安全、校验和资源释放。

## 公共契约

- 什么时候使用：修改公共接口、协议、序列化结构、ABI、DTO、枚举、数据库映射。
- Codex 生成代码时要遵守：必须说明兼容性、调用方、迁移和回滚；不得静默改变契约。
