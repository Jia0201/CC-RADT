---
id: "kb-agents-dev-backend-systems-review-checklist"
title: "Dev-Backend-Systems 代码审查清单"
type: "review-checklist"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Systems 代码审查清单

## 契约与兼容

- [ ] 公共接口、协议、DTO、ABI、枚举、序列化结构是否保持兼容？
- [ ] 调用方、迁移方式和回滚方式是否说明？
- [ ] 构建目标、JDK / C++ 标准、依赖版本是否匹配项目？

## Java / Spring

- [ ] 异常是否具体处理，是否避免吞异常？
- [ ] 资源是否关闭，连接池和线程池是否可控？
- [ ] 日志是否不泄露敏感信息？
- [ ] Spring 配置、Bean、事务边界是否清晰？

## C / C++

- [ ] 是否存在内存泄漏、越界、悬垂指针、未初始化变量？
- [ ] RAII、智能指针、所有权注释是否合理？
- [ ] 是否存在数据竞争、死锁或锁顺序不明？
- [ ] 编译警告、平台差异和 ABI 风险是否处理？

## 构建与性能

- [ ] Maven / Gradle / CMake / Make 修改是否最小化？
- [ ] 性能优化是否有基准或可解释验证？
- [ ] 是否运行编译、测试、静态检查或替代验证？

## 交接

- [ ] 是否说明变更文件、影响范围、验证命令、失败项和残余风险？
