---
id: "kb-agents-dev-backend-systems-source-map"
title: "Dev-Backend-Systems 权威来源"
type: "knowledge-source-map"
scope: "agent"
owner: "doc"
status: active
---
# Dev-Backend-Systems 权威来源

`01-source-map.md` 只放官方文档和主流规范，不放随机博客。

| 来源 | 地址 | 什么时候使用 | Codex 生成代码时要遵守什么 |
|---|---|---|---|
| Java 官方文档 | https://docs.oracle.com/en/java/ | Java 语言、标准库、JDK API | 使用项目 JDK 支持的 API，不臆造类或方法 |
| Spring Boot Docs | https://docs.spring.io/spring-boot/docs/current/reference/html/ | Spring Boot 配置、自动装配、测试、Actuator | 配置边界明确，不把敏感配置写入代码 |
| Spring Cloud Docs | https://spring.io/projects/spring-cloud | 服务发现、配置、网关、熔断、云原生 Java | 先确认项目使用的 Spring Cloud 版本和组件 |
| Maven Docs | https://maven.apache.org/guides/ | Maven 构建、依赖、插件 | 不随意改 groupId、artifactId、scope 和插件版本 |
| Gradle Docs | https://docs.gradle.org/ | Gradle 构建、任务、依赖管理 | 不引入与项目 Gradle 版本不兼容的 DSL |
| Alibaba Java Coding Guidelines | https://github.com/alibaba/p3c | Java 命名、异常、集合、并发、工程规范 | 无项目规范时作为 Java 默认规范参考 |
| C++ Core Guidelines | https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines | C++ 设计、资源、安全、并发 | 优先 RAII、类型安全、边界清晰 |
| cppreference | https://en.cppreference.com/ | C++ 标准库、语言特性、算法 | 使用当前编译目标支持的标准，不用未启用特性 |
| Google C++ Style Guide | https://google.github.io/styleguide/cppguide.html | C++ 命名、头文件、类设计、注释 | 项目无规范时作为 C++ 风格参考 |
| CMake Docs | https://cmake.org/cmake/help/latest/ | CMake 构建、target、依赖 | 使用 target 级配置，不乱改全局编译选项 |
| GNU Make Manual | https://www.gnu.org/software/make/manual/ | Makefile、构建目标、依赖 | 目标和依赖显式，不用隐式破坏性命令 |
| CERT C/C++ | https://wiki.sei.cmu.edu/confluence/display/seccode | C/C++ 安全编码、内存、整数、并发 | 安全敏感代码优先检查 CERT 规则 |
| MISRA C/C++ | https://www.misra.org.uk/ | 嵌入式、车规、强约束 C/C++ 摘要 | 仅在项目要求或强约束场景引用，不随意宣称完全合规 |
