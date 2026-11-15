# 点名器

纯前端随机点名工具，双击 `index.html` 即可使用，无需服务器、无需联网。

当前版本：**v1.1.0**（详见 [CHANGELOG.md](CHANGELOG.md)）

## 界面

- 深空星空背景（canvas 星点 + 星云光晕 + 偶发流星）+ 磨砂玻璃面板 + 霓虹细描边，金色渐变标题 `点名器`
- 中央磨砂玻璃盘面显示姓名，抽中时放大定格并撒彩带
- 暗玻璃次按钮配蓝紫霓虹描边、实色渐变主按钮，圆角胶囊控件
- 下方两个按钮：开始随机 / 停止选人（同一个按钮切换）、重置记录
- 底部显示「已提问过的同学：」记录
- 右上角齿轮按钮打开右侧「设置」抽屉，抽屉内提供「导入 Excel」入口和「界面皮肤」切换；左上角显示名单人数
- 设置抽屉「皮肤设置」子菜单内的动态参数可实时调整：流星间隔、流星头部大小、背景星数量、闪烁星数量、星点呼吸速度、极光流动速度；关闭抽屉、页面隐藏或刷新时写入本地存储
- 内置六个皮肤：「经典星空」（深空背景、流星与彩带）、「简约」（深色扁平金边、彩带）、「玻璃拟态」（低饱和极光 + 细噪点 + 磨砂玻璃）、「新拟态」（浅色柔影 Soft UI）、「便当盒」（浅灰底 + 白色姓名卡 + 蓝紫渐变强调）和「AI 原生」（浅色虹彩渐变），选择会被记住

## 使用

1. 打开 `index.html`。
2. 点击右上角齿轮打开「设置」，点「导入 Excel」选择表格，或直接把文件拖进页面。
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
| 重置记录 | 清空已点记录，姓名重新回到待抽池，姓名面板回到「准备开始」，不弹提示 |

## 皮肤与代码结构

界面采用「核心 + 皮肤」策略模式：

- `js/core.js`：名单状态、localStorage、Excel 解析、点名规则与滚动循环，不接触任何页面 DOM。
- `js/skins/*.js`：皮肤实现，各自负责 DOM、事件、特效与设置项。
- `js/app.js`：引导层，创建核心、挂载/切换皮肤、全局空格键与拖拽导入。
- `js/ui/settings.js`：皮肤共用设置抽屉外壳，固定提供导入入口与皮肤选择器。
- `js/ui/skin-kit.js`：轻量皮肤工厂，封装通用渲染、历史、设置入口与生命周期；新皮肤只需提供模板和类名。

皮肤接口（经典脚本 + 全局命名空间，无需构建工具）：

```js
NamePicker.skins.register({
  id: 'my-skin',
  label: '我的皮肤',
  css: 'css/skins/my-skin.css',
  create(ctx) {
    return {
      mount(root, ctx) {},       // 在 root 内生成自己的 DOM 并绑定局部事件
      unmount() {},              // 清理 DOM、监听、RAF、定时器
      render(state, change) {},  // 幂等全量渲染，change.reason 区分 init/import/start/stop/reset/skin
      tick(name) {},             // 滚动中的候选姓名
      toast(message, tone) {},
      celebrate() {},            // 可选
      setDropActive(active) {}   // 可选
    };
  }
});
```

新增皮肤时：加入 `js/skins/<name>.js` 与 `css/skins/<name>.css`，在 `index.html` 中按现有格式追加 `<script>` 和带 `data-skin-css` 的 `<link>`（`media="not all"`）。切换皮肤只启用当前皮肤的样式表，因此不同皮肤可以复用同名 class。使用 `NamePicker.createSimpleSkin()` 时只需提供模板、类名和长姓名适配参数。

### 皮肤配置存储

每个皮肤的用户设置写入独立的 JSON 键 `picker.settings.<皮肤id>`，互不覆盖，刷新或重新打开后自动恢复：

```json
{
  "version": 1,
  "effects": {
    "meteorCycle": 8,
    "meteorHead": 9,
    "baseStarCount": 1200,
    "starCount": 100,
    "twinkleSpeed": 1,
    "auroraSpeed": 1
  }
}
```

皮肤代码里通过 `NamePicker.settings.get(id, fallback)` / `NamePicker.settings.set(id, value)` 读写。经典星空会兼容旧版 `picker.motion` 的配置，并在下次保存时写入新键；简约、玻璃拟态、新拟态、便当盒、AI 原生目前没有可调项，因此不会生成配置。

## 文件说明

```
name_picker/
├── index.html                    页面外壳：挂载点 + 样式/脚本引用
├── css/
│   ├── base.css                  与皮肤无关的 reset
│   └── skins/
│       ├── classic.css           经典星空皮肤样式
│       ├── minimal.css           简约皮肤样式
│       ├── glass.css             玻璃拟态皮肤样式
│       ├── softui.css            新拟态皮肤样式
│       ├── bento.css             便当盒皮肤样式
│       └── ainative.css          AI 原生皮肤样式
├── js/
│   ├── boot-skin.js              首屏预启用正确皮肤样式
│   ├── namespace.js              命名空间、存储、皮肤注册表、监听清理器
│   ├── core.js                   点名核心：状态、导入解析、随机、滚动循环
│   ├── app.js                    引导：创建核心、切换皮肤、全局键盘/拖拽
│   ├── ui/
│   │   ├── common.js             toast、长姓名适配等共用 UI 工具
│   │   ├── settings.js           共用设置抽屉（导入、皮肤选择器）
│   │   └── skin-kit.js           轻量皮肤工厂（模板 + 类名即可注册）
│   └── skins/
│       ├── classic.js            经典星空皮肤
│       ├── minimal.js            简约皮肤
│       ├── glass.js              玻璃拟态皮肤
│       ├── softui.js             新拟态皮肤
│       ├── bento.js              便当盒皮肤
│       └── ainative.js           AI 原生皮肤
├── vendor/xlsx.full.min.js       SheetJS，本地解析 Excel
├── .github/workflows/deploy.yml  tag 触发 Pages 部署
├── CHANGELOG.md                  更新日志
└── README.md                     本说明
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
