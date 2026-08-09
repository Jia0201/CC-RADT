---
id: "kb-agents-dev-backend-systems-code-style"
title: "Dev-Backend-Systems 代码风格"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Systems 代码风格

## Java

- 什么时候使用：Java 后端、Spring Boot、SpringCloud、工具类、测试。
- Codex 生成代码时要遵守：优先项目风格；无规范时参考 Alibaba Java Coding Guidelines；异常、日志、集合、并发和资源关闭按规范检查。

## Spring Boot / SpringCloud

- 什么时候使用：Controller、Service、Repository、配置、测试、微服务组件。
- Codex 生成代码时要遵守：层次职责清晰；配置不硬编码；Bean 生命周期和自动装配边界明确。

## C++

- 什么时候使用：C++ 模块、性能敏感逻辑、系统接口、库封装。
- Codex 生成代码时要遵守：优先 RAII、智能指针、const 正确性；头文件最小依赖；不滥用宏和全局状态。

## C

- 什么时候使用：C 模块、嵌入式、系统调用、底层库。
- Codex 生成代码时要遵守：边界检查、资源释放、错误码、初始化和释放顺序必须显式。

## 构建脚本

- 什么时候使用：CMake、Make、Maven、Gradle。
- Codex 生成代码时要遵守：target / module 级修改优先；不把本机绝对路径写入构建；依赖版本变更要说明。

## 注释

- 什么时候使用：并发、内存所有权、ABI、兼容、性能权衡。
- Codex 生成代码时要遵守：注释解释约束和原因，不复述语句。
