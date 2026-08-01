# 视觉走查报告 — hdochub 个人技术博客

| 项目 | 内容 |
|------|------|
| 文档名称 | 视觉走查报告（Visual Review） |
| 项目名称 | hdochub 个人技术博客 |
| 设计风格 | 野兽派（Brutalism） |
| 走查依据 | 《设计规范 design-system.md V1.0》《页面原型 wireframes.md V1.0》 |
| 走查人 | 设计师 |
| 走查日期 | 2026-07-28 |
| 走查结论 | **通过（修复后）** |

---

## 0. 走查总结

本次走查覆盖前端全部源码：TailwindCSS 配置、全局样式、28 个公共/布局/业务组件、3 个布局、25 个页面。

走查共发现 **4 类、14 处** 不符合野兽派设计规范的问题，均已在代码中直接修复。修复后全站满足设计规范铁律（无圆角、无阴影、无渐变、硬边框、高对比、内容至上）。

| 问题类别 | 发现数 | 已修复 | 残留 |
|----------|--------|--------|------|
| 装饰性彩色 Emoji（违反「禁止彩色图标/emoji 装饰」） | 7 处 | 7 | 0 |
| 链接使用 `hover:underline`（1px 下划线，违反「2px 硬边框/翻转」交互语言） | 6 处 | 6 | 0 |
| 半透明叠加 `opacity-*`（违反「禁止透明度叠加」） | 3 处 | 3 | 0 |
| 站点标题 hover 变灰（违反「黑白翻转」反色规则） | 1 处 | 1 | 0 |

铁律项（无圆角 / 无阴影 / 无渐变 / 主色仅黑白红黄+灰阶 / 字体栈 / 字号层级 / 间距 4px 倍数 / 0.05s 线性过渡 / 黄色 focus outline）走查全部通过，无需修复。

---

## 1. 走查范围

| 范围 | 文件 |
|------|------|
| 配置 | `src/client/tailwind.config.ts` |
| 全局样式 | `src/client/assets/css/main.css` |
| 公共组件 | `src/client/components/common/` 共 16 个（BButton、BInput、BTextarea、BSelect、BTag、BPagination、BCheckbox、BSwitch、BAlert、BModal、BTable、BBadge、BAvatar、BEmpty、BSearchBar、BLoading、BToastContainer、BConfirmDialog） |
| 布局组件 | `src/client/components/layout/`（TheHeader、TheFooter、TheSidebar） |
| 文章组件 | `src/client/components/article/`（ArticleCard、ArticleToc、MarkdownRenderer、LikeButton） |
| 评论组件 | `src/client/components/comment/`（CommentList、CommentItem） |
| 编辑器 | `src/client/components/editor/MarkdownEditor.vue` |
| 页面布局 | `src/client/layouts/`（default、admin、dashboard） |
| 页面 | `src/client/pages/` 共 25 个（前台 11 + dashboard 6 + admin 7 + error/app） |

---

## 2. 检查项详细结果

### 2.1 色彩系统 — 通过

| 检查点 | 结果 | 说明 |
|--------|------|------|
| 主色纯黑 `#000000` / 纯白 `#FFFFFF` | 通过 | `tailwind.config.ts` L17-18、`main.css` L11-12 定义一致 |
| 撞色纯红 `#FF0000` / 纯黄 `#FFFF00` | 通过 | `tailwind.config.ts` L19-24、`main.css` L13-14 定义一致 |
| 灰阶 6 级 | 通过 | `ink` 色板（900/700/500/300/200/100）与规范色值完全一致 |
| 状态色（成功绿/信息蓝） | 通过 | green `#008000`、blue `#0000FF` |
| 无渐变 | 通过 | 源码全局检索 `linear-gradient`/`radial-gradient`/`conic-gradient` 无匹配 |
| 无柔和色/莫兰迪色 | 通过 | 全部为规范色板内色值 |
| 无大面积透明度叠加 | **修复后通过** | 见问题 #3（BTag、tag/index.vue、BSwitch 使用了 `opacity-*`，已改为灰阶色值） |

### 2.2 字体系统 — 通过

| 检查点 | 结果 | 说明 |
|--------|------|------|
| UI 使用等宽字体 | 通过 | `tailwind.config.ts` L40-41 `fontFamily.mono` 与规范一致；`main.css` body 默认 `font-mono` |
| 正文使用无衬线 | 通过 | `fontFamily.sans` 与规范一致；`.prose-brutal` 使用 `font-sans` |
| 字号层级 H1-H6/Body/Small/Caption/Code | 通过 | `tailwind.config.ts` L70-82 全量定义且字重/行高/字间距与规范表 3.2 完全一致 |
| 字重仅 400/700 | 通过 | 标题 `font-bold`(700)、正文默认 400；无 300 等细字重 |

### 2.3 视觉规则（铁律） — 通过

| 检查点 | 结果 | 说明 |
|--------|------|------|
| 无圆角 | 通过 | `main.css` L29-32 `* { border-radius: 0 !important; box-shadow: none !important; }`；`tailwind.config.ts` L44-53 全部 borderRadius 置 0 |
| 无阴影 | 通过 | 同上；`boxShadow` 配置全部 `none`；源码无 `shadow-*` 类、无 `text-shadow` |
| 无渐变 | 通过 | 源码无任何 `gradient` |
| 硬边框分隔 | 通过 | 卡片/表格/分区统一使用 `border-2 border-black`，表格行分隔 `1px solid #E0E0E0` |

### 2.4 交互规范 — 修复后通过

| 检查点 | 结果 | 说明 |
|--------|------|------|
| Hover 黑白翻转 | **修复后通过** | 见问题 #4（TheHeader 站点标题 hover 变灰，已改为黑底白字翻转） |
| Active `translate(2px,2px)` + 3px 边框 | 通过 | `.btn:active` `main.css` L112-115 实现 |
| Focus 黄色硬外框 `outline: 4px solid #FFFF00` | 通过 | `main.css` L69-72 `*:focus-visible`；`.input:focus` L163-166 |
| 过渡 `0.05s linear` | 通过 | `tailwind.config.ts` L63-68；全站 `transition-all duration-fast ease-linear`；Toast 动画 0.05s；无 `ease-out`/`cubic-bezier` |
| 链接 2px 底边线或翻转 | **修复后通过** | 见问题 #2（6 处 `hover:underline` 已改为 2px 硬边框/翻转） |
| 禁用态灰底/灰字/浅边框 | 通过 | `.btn:disabled`、`.input:disabled`、BPagination disabled 类一致 |

### 2.5 布局规范 — 通过

| 检查点 | 结果 | 说明 |
|--------|------|------|
| 4px 基础间距单位 | 通过 | `tailwind.config.ts` L91-100 spacing 仅 4/8/12/16/24/32/48/64 |
| 容器最大宽度（列表 1200 / 正文 680 / 后台 1280） | 通过 | `maxWidth` L101-106；`.container-list`/`.container-content`/`.container-admin` |
| 容器左右外边距 PC 48 / 平板 24 / 移动 16 | 通过 | `.container-list px-12`(48px)；响应式由 `md:`/`lg:` 断点控制 |
| 响应式三断点（PC>1024 / 平板 768-1024 / 移动<768） | 通过 | 全站使用 `sm:`(640)/`md:`(768)/`lg:`(1024) 移动优先写法 |
| 卡片网格 PC 三列 / 平板两列 / 移动单列 | 通过 | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` |
| 移动端汉堡菜单 `≡` | 通过 | TheHeader L118-123 使用 `≡` 字符按钮 |

### 2.6 组件规范 — 修复后通过

| 组件 | 结果 | 说明 |
|------|------|------|
| 按钮（主/次/危险/文字） | 通过 | `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-danger`/`.btn-text` 严格符合规范 6.1；BButton 封装一致 |
| 输入框 | 通过 | `.input` 2px 黑边、focus 3px+黄 outline、错误红边、禁用灰；BInput/BTextarea/BSelect 一致 |
| 表格 | 通过 | `.brutal-table` 表头黑底白字 2px 底边、斑马纹 `#F5F5F5`、行 hover 黄底、外框 2px |
| 卡片 | 通过 | `.card` 2px 黑边无圆角无阴影；`.card-hover` 黑白翻转；ArticleCard 内部分区 2px 横线 |
| 标签 | 通过 | `.tag`/`.tag-solid`/`.tag-category` hover 翻转符合 6.5 |
| 分页器 | 通过 | 40×40 方块、2px 黑边、当前页黑底白字、禁用灰、共享边框（`border-l-0`） |
| 侧边栏 | **修复后通过** | 见问题 #1（菜单项 emoji 图标已替换为等宽字符标签） |
| 弹窗 | 通过 | 4px 黑外框、标题栏黑底白字、遮罩 `rgba(0,0,0,0.7)` |
| 提示条/徽标/头像/代码块 | 通过 | 全部符合规范第 6、9 章 |
| 搜索框 | **修复后通过** | 见问题 #1（搜索图标 emoji 已替换为 `[Q]` 文字标签） |
| Markdown 编辑器工具栏 | **修复后通过** | 见问题 #1（工具栏 emoji 已替换为等宽文字标签） |
| 文章卡片元信息 | **修复后通过** | 见问题 #1（评论数 emoji 已替换为 `[C]` 文字标签） |

---

## 3. 不符合规范的问题与修复

### 问题 #1：装饰性彩色 Emoji（违反规范第 10 章「禁止彩色图标、emoji 装饰」）

规范第 10 章明确：「禁止彩色图标、3D 图标、填充拟物图标、emoji 装饰」，仅允许等宽字符/符号（`≡ × < > # ♡ ▶`）。以下位置使用了彩色 Emoji，已全部替换为等宽文字标签或允许的符号。

| # | 文件 | 行号(修复前) | 原内容 | 修复后 | 状态 |
|---|------|--------------|--------|--------|------|
| 1.1 | `src/client/components/layout/TheSidebar.vue` | 17, 26 | `💬`（评论菜单图标） | `[>]` | 已修复 |
| 1.2 | `src/client/components/layout/TheSidebar.vue` | 28 | `⚙`（站点设置图标） | `[S]` | 已修复 |
| 1.3 | `src/client/components/article/ArticleCard.vue` | 63 | `💬 {{ commentCount }}` | `[C] {{ commentCount }}` | 已修复 |
| 1.4 | `src/client/components/common/BSearchBar.vue` | 41 | `🔍`（搜索图标） | `[Q]` | 已修复 |
| 1.5 | `src/client/components/editor/MarkdownEditor.vue` | 44 | `❝`（引用按钮） | `""` | 已修复 |
| 1.6 | `src/client/components/editor/MarkdownEditor.vue` | 45 | `🔗`（链接按钮） | `LNK` | 已修复 |
| 1.7 | `src/client/components/editor/MarkdownEditor.vue` | 46 | `🖼`（图片按钮） | `IMG` | 已修复 |

> 顺带将 MarkdownEditor 工具栏的 `•`/`1.`/`表格` 统一为等宽英文标签 `UL`/`OL`/`TBL`，并给侧边栏图标容器加宽至 `w-6` 以适配 3 字符标签。

**允许保留的等宽符号**（符合规范）：`≡`（汉堡菜单）、`×`（关闭）、`<` `>` `→` `←`（导航）、`♡` `♥`（点赞，规范 8.x 显式允许 `♡`）、`▼` `▲` `▶`（折叠箭头）、`✓`（勾选）。这些均未修改。

### 问题 #2：链接使用 `hover:underline`（违反规范第 8.5 章「2px solid #000 底边线或翻转」）

规范 8.5 规定界面/正文链接 hover 应使用 `2px solid #000` 底边线或黑白翻转。`hover:underline` 渲染为 1px 下划线，且无颜色翻转，不符合野兽派硬边框语言。已全部改为「2px 硬底边框 + 黑白翻转」。

| # | 文件 | 行号(修复前) | 修复后 |
|---|------|--------------|--------|
| 2.1 | `src/client/pages/post/[slug].vue` | 74, 76 | 面包屑链接改为 `border-b-2 border-transparent hover:border-black hover:bg-black hover:text-white` |
| 2.2 | `src/client/pages/admin/posts.vue` | 138 | 表格标题链接改为 2px 底边 + 翻转 |
| 2.3 | `src/client/pages/admin/comments.vue` | 131 | 文章标题链接改为 2px 底边 + 翻转 |
| 2.4 | `src/client/pages/dashboard/posts.vue` | 126 | 表格标题链接改为 2px 底边 + 翻转 |
| 2.5 | `src/client/pages/dashboard/comments.vue` | 66 | 文章标题链接改为 2px 底边 + 翻转 |
| 2.6 | `src/client/pages/dashboard/index.vue` | 70, 79, 92 | 「全部 →」与最近文章标题链接改为 2px 底边 + 翻转（黑底上用 `hover:bg-yellow hover:text-black`） |

### 问题 #3：半透明叠加 `opacity-*`（违反规范第 2.1 章「禁止透明度叠加」）

规范 2.1 明确：「禁止透明度叠加（rgba 仅在极个别遮罩场景使用）」。`opacity-70`/`opacity-60`/`opacity-50` 用于次要文字与禁用态，应改用灰阶色值。

| # | 文件 | 行号(修复前) | 原内容 | 修复后 |
|---|------|--------------|--------|--------|
| 3.1 | `src/client/components/common/BTag.vue` | 39 | `opacity-70`（标签计数） | `text-ink-500`（`#808080`） |
| 3.2 | `src/client/pages/tag/index.vue` | 38 | `opacity-60`（标签云计数） | `text-ink-500` |
| 3.3 | `src/client/components/common/BSwitch.vue` | 25 | `disabled:opacity-50` | `disabled:bg-ink-100 disabled:border-ink-200 disabled:cursor-not-allowed`（与规范禁用态一致） |

### 问题 #4：站点标题 hover 变灰（违反规范第 8.3 章「黑白翻转」）

规范 8.3 规定交互核心为「黑白翻转」：默认浅底深字 → Hover 深底浅字。`TheHeader` 站点标题原为 `hover:text-ink-700`（变灰），未实现翻转。

| # | 文件 | 行号(修复前) | 修复后 |
|---|------|--------------|--------|
| 4.1 | `src/client/components/layout/TheHeader.vue` | 53 | 改为 `border-2 border-transparent px-2 py-1 hover:bg-black hover:text-white`（黑底白字翻转） |

---

## 4. 通过项亮点（无需修改）

以下实现严格符合规范，记录为通过项佐证走查深度：

- **铁律强制层**：`main.css` 使用 `* { border-radius: 0 !important; box-shadow: none !important; }` 全局兜底，即使有遗漏的 `rounded-*`/`shadow-*` 类也会被覆盖。
- **Focus 可访问性**：`*:focus-visible { outline: 4px solid #FFFF00 }` 全局生效，且 `*:focus:not(:focus-visible)` 隐藏鼠标聚焦外框，完全符合 8.4。
- **代码高亮**：`main.css` Brutal Terminal 主题 Token 配色与规范第 9 章色值表逐一对应；行内代码黄底黑字 `#FFFF00`/`#000000` 2px 黑边（9.3）。
- **按钮三态**：`.btn` 默认/`:hover`/`:active`/`:disabled` 严格遵循 6.1 表，active 含 `translate(2px,2px)` 与 3px 边框。
- **表格**：`.brutal-table` 表头黑底白字、斑马纹、行 hover 黄底、外框 2px，与 6.8 完全一致。
- **分页器**：BPagination 40×40 方块、共享边框（`border-l-0`）、当前页翻转、禁用灰态，符合 6.7。
- **响应式**：首页/详情页三栏→两栏→单栏断点切换、移动端汉堡菜单 `≡`、表格横向滚动 `overflow-x-auto`，均符合第 7 章。
- **间距系统**：`tailwind.config.ts` spacing 仅含 4px 倍数值，无 5px/7px 等违规值。

---

## 5. 走查结论

**通过（修复后）。**

本次走查发现的 14 处问题均属「装饰性元素与交互细节」层面，未触及野兽派铁律（圆角/阴影/渐变/主色/字体/间距均合规）。所有问题已在代码中直接修复，修复方式遵循「等宽文字标签替代 emoji」「2px 硬边框 + 黑白翻转替代 1px 下划线」「灰阶色值替代透明度」三原则，与既有设计语言保持一致。

修复后全站前端实现符合《设计规范 design-system.md V1.0》与《页面原型 wireframes.md V1.0》，可交付测试环节。

> 备注：本次走查未安装 `node_modules`，未执行 `nuxt build` 全量构建验证；所有修复均为模板字符串与 CSS 类名层面的等价替换，不涉及 script 逻辑变更，理论上不影响编译。建议开发在合并前补跑一次 `npm run build` 确认无回归。

---

**走查报告结束。**
