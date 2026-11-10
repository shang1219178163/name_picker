# 点名器

纯前端随机点名工具，双击 `index.html` 即可使用，无需服务器、无需联网。

当前版本：**v1.1.0**（详见 [CHANGELOG.md](CHANGELOG.md)）

## 界面

- 深空星空背景（canvas 星点 + 星云光晕 + 偶发流星）+ 磨砂玻璃面板 + 霓虹细描边，金色渐变标题 `点名器`
- 中央磨砂玻璃盘面显示姓名，抽中时放大定格并撒彩带
- 暗玻璃次按钮配蓝紫霓虹描边、实色渐变主按钮，圆角胶囊控件
- 下方三个按钮：开始随机 / 停止选人（同一个按钮切换）、重置名单、清空记录
- 底部显示「已提问过的同学：」记录
- 右上角「导入 Excel」，旁边齿轮按钮打开「动态参数」面板，左上角显示名单人数
- 动态参数可实时调整：流星间隔、流星头部大小、背景星数量、闪烁星数量、星点呼吸速度、极光流动速度；关闭面板时写入本地存储

## 使用

1. 打开 `index.html`。
2. 点击右上角「导入 Excel」选择表格，或直接把文件拖进页面。
3. 点击「开始随机」，名字开始滚动，按钮变为红色的「停止选人」。
4. 再次点击同一按钮（或直接点姓名面板、按空格）定格结果，按钮恢复绿色「开始随机」。
5. 下一次点名会自动跳过已经点过的同学。

## Excel 格式

支持 `.xlsx` / `.xls` / `.csv`，读取第一张工作表。

推荐只有一列姓名：

| 姓名 |
| --- |
| 张三 |
| 李四 |
| 王五 |

多列也可以，程序会优先找表头为「姓名 / 名字 / 学生姓名 / name」的列：

| 序号 | 姓名 | 学号 |
| --- | --- | --- |
| 1 | 张三 | 2024001 |
| 2 | 李四 | 2024002 |

- 没有表头时，自动选取文本内容最多的一列，不会把学号、序号当名字。
- CSV 自动兼容 UTF-8 与 GBK 编码。
- 同名只保留一次。

## 按钮说明

| 按钮 | 作用 |
| --- | --- |
| 开始随机 / 停止选人 | 同一个按钮：点击开始滚动，同时变红显示「停止选人」；再点一次定格结果并写入已点记录 |
| 重置名单 | 清空已点记录，姓名重新回到待抽池 |
| 清空记录 | 只清空底部记录，保留当前显示的姓名，不弹提示 |

## 文件说明

```
name_picker/
├── index.html                 页面结构
├── style.css                  样式与动效
├── app.js                     点名、导入、存储等逻辑
├── vendor/xlsx.full.min.js    SheetJS，本地解析 Excel
├── .github/workflows/deploy.yml  tag 触发 Pages 部署
├── CHANGELOG.md               更新日志
└── README.md                  本说明
```

## 备注

- 名单与已点记录保存在浏览器 localStorage 中，换浏览器或清理浏览器数据会丢失。
- 如果浏览器限制本地文件读取，可用静态服务器打开：
  `python3 -m http.server 8000`，然后访问 `http://localhost:8000`。

## 在线访问

GitHub Pages 自动部署：https://shang1219178163.github.io/name_picker/

推送 `v*.*.*` 形式的 tag（如 `v1.1.0`）会触发 `.github/workflows/deploy.yml`，自动发布到 Pages。普通提交不会上线，只有打 tag 才发版。

## 分支模型（Git Flow）

| 分支 | 用途 |
| --- | --- |
| `main` | 线上版本，只接受来自 `release/*` 或 `hotfix/*` 的合并，必须通过 PR 合入（已加分支保护）；打 tag 才部署 |
| `develop` | 日常开发集成分支，功能完成后合并到此 |
| `feature/*` | 单个功能开发，从 `develop` 切出，完成后合回 `develop` |
| `release/*` | 发版准备，从 `develop` 切出，合入 `main` 并回流 `develop` |
| `hotfix/*` | 线上紧急修复，从 `main` 切出，合入 `main` 与 `develop` |

日常流程：

```bash
git checkout develop
git checkout -b feature/xxx
# ... 开发、提交 ...
git checkout develop && git merge --no-ff feature/xxx
git branch -d feature/xxx
```

发布流程：

```bash
git checkout -b release/1.0.0 develop
# 在 release 分支上更新 CHANGELOG、最终测试
gh pr create --base main --head release/1.0.0   # 走 PR 合入 main
gh pr merge --merge                              # 合并后 main 不会自动部署
git checkout main && git pull
git tag v1.1.0 && git push origin v1.1.0         # 打 tag 才会触发 Pages 部署
git checkout develop && git merge --no-ff release/1.0.0
git branch -d release/1.0.0
```

`main` 已开启分支保护：禁止直接 push 和强推，改动必须走 PR；`develop` 禁止强推与删除。部署只看 tag：推送 `v*.*.*` 即发布到 Pages，可随时用旧 tag 回滚。
