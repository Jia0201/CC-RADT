# 正式发布检查单

- [ ] 当前分支为 `dev` 且工作区干净
- [ ] `VERSION`、`MANIFEST.json`、`CHANGELOG.md` 与目标版本一致
- [ ] 已创建 `release: prepare vX.Y.Z` 提交
- [ ] 已创建 `dev-vX.Y.Z` 注释源标签
- [ ] 主工程自检、Fixture E2E、Hook schema 和记忆审计通过
- [ ] 使用 `--release --verify` 生成全新正式包
- [ ] 包含 `RELEASE_RECORD.md`、manifest 和 checksum
- [ ] 安装包无敏感内容、本机路径、实验室、构建脚本和运行状态
- [ ] 全新目录安装态自检通过
- [ ] `main` 只更新生成后的运行内容
- [ ] 已创建 main 运行提交、`vX.Y.Z` 标签和 GitHub Release
- [ ] 已回填 dev 发布记录中的 main 提交和 Release URL
