# 棒球队管理系统

一个基于 Flask 的棒球队管理系统，用来管理球员资料、比赛记录、打击/投球统计、对局历史，以及历年比赛 PDF 数据。

当前项目已经完成一轮数据库重构：

- 数据库统一使用 SQLite
- 球员被明确拆分为两种角色：`投手` 或 `场员`
- 基础资料与统计档案分离
- 增加了 Prisma schema，方便后续接入 Node/前后端分层开发

## 主要功能

- 球员管理
  - 添加球员
  - 编辑球员资料
  - 删除球员
  - 区分投手与场员
- 比赛记录管理
  - 添加单场打击记录
  - 添加单场投球记录
  - 删除错误比赛记录
- 数据统计
  - 打击统计表
  - 投手统计表
  - 打击/投手排行榜
  - 可视化图表
- 对局分析
  - 查看球员对阵特定对手的历史数据
  - 查看球员全部比赛记录
  - 查看全队全部比赛记录
- PDF 资料管理
  - 浏览历年比赛 PDF
  - 批量预览 PDF 解析结果
  - 批量导入 PDF 中的比赛数据
- 数据导出
  - 导出球员数据为 CSV

## 技术栈

- 后端：Flask
- ORM：Flask-SQLAlchemy
- 数据库：SQLite
- 数据迁移辅助：Flask-Migrate
- 数据分析：pandas
- 图表：matplotlib / seaborn / plotly
- PDF 解析：pdfplumber
- 前端：Bootstrap 5 + 原生 JavaScript + jQuery/DataTables
- 数据建模标准：Prisma schema

## 数据库设计

### 当前核心表

- `players`
  - 球员主档案
  - 只保存身份与基础资料
- `fielder_profiles`
  - 场员/野手的打击与守备汇总
- `pitcher_profiles`
  - 投手的投球汇总
- `game_records`
  - 单场比赛记录
- `positions`
  - 守备位置字典
- `player_positions`
  - 球员与守备位置的关联表

### 设计规则

- 一个球员当前只能是 `投手` 或 `场员`
- 投手的主位置固定为 `投手`
- 场员不能再挂 `投手` 位置
- 单场记录仍存放在 `game_records`
- 汇总数据会同步写入对应档案表

### Prisma

Prisma schema 位于：

- [prisma/schema.prisma](/Users/baiyunxiao/Desktop/baseball-player-manager/prisma/schema.prisma)

说明：

- 当前运行时仍然是 Flask + SQLAlchemy
- Prisma 目前作为标准数据模型存在
- 后续如果要接入 Node/Next.js，可以直接基于这份 schema 扩展

## 页面入口

- `/`
  - 首页
- `/players`
  - 球员列表
- `/add_player`
  - 添加球员
- `/game_stats`
  - 比赛统计
- `/add_game_record`
  - 添加比赛记录
- `/stats`
  - 综合统计与图表
- `/matchup_stats`
  - 对局信息统计
- `/pdf_viewer`
  - PDF 查看器
- `/import_pdf`
  - PDF 批量导入

## 环境要求

建议环境：

- Python 3.12
- pip3
- Node.js 20+
- macOS / Linux / Windows 均可

其中：

- 运行 Flask 项目主要依赖 Python
- Node.js 主要用于后续 Prisma / 前端工具链扩展

## 安装步骤

### 1. 进入项目目录

```bash
cd /Users/baiyunxiao/Desktop/baseball-player-manager
```

### 2. 安装 Python 依赖

```bash
pip3 install -r requirements.txt
```

### 3. 安装 Node.js

macOS（Homebrew）：

```bash
brew install node
```

确认安装：

```bash
python3 --version
pip3 --version
node --version
npm --version
```

## 启动项目

### 1. 初始化数据库

如果你要新建数据库：

```bash
python init_db.py
```

### 2. 启动 Flask 服务

```bash
python app.py
```

默认访问地址：

```text
http://127.0.0.1:5000
```

## 已有数据库迁移

如果仓库里已经有旧版本数据库，并且你想把旧的“球员大表”统计迁移到新结构：

```bash
python migrate_profiles_sqlite.py
```

这个脚本会自动：

- 备份现有数据库
- 创建 `fielder_profiles` 和 `pitcher_profiles`
- 把旧 `players` 表中的统计迁移到新档案表
- 规范投手/场员角色与位置

当前数据库备份示例：

- [instance/baseball_players.backup_20260405_125745.db](/Users/baiyunxiao/Desktop/baseball-player-manager/instance/baseball_players.backup_20260405_125745.db)

## PDF 导入

### Web 页面方式

打开：

```text
http://127.0.0.1:5000/import_pdf
```

支持：

- 预览 PDF 解析结果
- 单个导入
- 一键批量导入

### 命令行方式

预览模式：

```bash
python import_pdfs.py --dry-run
```

实际导入：

```bash
python import_pdfs.py
```

## 常用脚本

- [app.py](/Users/baiyunxiao/Desktop/baseball-player-manager/app.py)
  - Flask 主入口
- [database.py](/Users/baiyunxiao/Desktop/baseball-player-manager/database.py)
  - 数据模型定义
- [init_db.py](/Users/baiyunxiao/Desktop/baseball-player-manager/init_db.py)
  - 初始化数据库
- [migrate_profiles_sqlite.py](/Users/baiyunxiao/Desktop/baseball-player-manager/migrate_profiles_sqlite.py)
  - 旧数据库迁移到新档案结构
- [import_pdfs.py](/Users/baiyunxiao/Desktop/baseball-player-manager/import_pdfs.py)
  - 批量导入 PDF 数据
- [cleanup_db.py](/Users/baiyunxiao/Desktop/baseball-player-manager/cleanup_db.py)
  - 清洗球员名字、合并重复球员、重算统计
- [pdf_parser.py](/Users/baiyunxiao/Desktop/baseball-player-manager/pdf_parser.py)
  - PDF 解析逻辑

## API 概览

### 球员

- `GET /api/players`
- `POST /api/players`
- `PUT /api/players/<player_id>`
- `DELETE /api/players/<player_id>`
- `GET /api/players/batters`
- `GET /api/players/pitchers`

### 比赛记录

- `POST /api/game_records`

### 统计

- `GET /api/stats/batting`
- `GET /api/stats/pitching`
- `GET /api/stats/visualization`
- `GET /api/stats/batting_leaderboard`
- `GET /api/stats/pitching_leaderboard`
- `GET /api/visualization/batting`
- `GET /api/visualization/pitching`
- `GET /api/export/csv`

### 对局

- `GET /api/matchup/opponents`
- `GET /api/matchup/player_vs_opponent`
- `GET /api/matchup/player_game_records`
- `GET /api/matchup/all_game_records`
- `DELETE /api/matchup/game_record/<record_id>`

### PDF

- `GET /api/pdf/files`
- `GET /api/pdf/view/<filepath>`
- `GET /api/pdf/parse/<filepath>`
- `POST /api/pdf/import_all`
- `POST /api/pdf/import_one`

## 目录结构

```text
baseball-player-manager/
├── app.py
├── database.py
├── init_db.py
├── migrate_profiles_sqlite.py
├── import_pdfs.py
├── cleanup_db.py
├── pdf_parser.py
├── requirements.txt
├── README.md
├── prisma/
│   ├── schema.prisma
│   └── README.md
├── instance/
│   └── baseball_players.db
├── data/
│   ├── 2023/
│   ├── 2024/
│   └── 2025/
├── templates/
└── static/
```

## 当前已完成的数据库重构

这次重构重点解决了原来“所有统计都塞在球员主表里”的问题：

- `Player` 只保留主档案
- 新增 `FielderProfile`
- 新增 `PitcherProfile`
- 前端新增球员类型字段
- 添加比赛记录时会校验角色
  - 投手不能录入场员记录
  - 场员不能录入投手记录
- 旧数据库已支持迁移与备份

## 已知说明

- 当前项目没有 `package.json`
  - 所以 Node.js 现在主要是给 Prisma 和后续工具链准备
- Prisma schema 已经补齐
  - 但运行时数据库访问仍由 SQLAlchemy 负责
- SQLite 数据文件默认位于：
  - [instance/baseball_players.db](/Users/baiyunxiao/Desktop/baseball-player-manager/instance/baseball_players.db)

## 故障排查

### 1. `ModuleNotFoundError`

重新安装依赖：

```bash
pip3 install -r requirements.txt
```

### 2. 启动后页面为空或数据异常

检查数据库是否存在：

```bash
ls instance
```

如果需要重新初始化：

```bash
python init_db.py
```

### 3. 旧数据库结构不一致

执行迁移：

```bash
python migrate_profiles_sqlite.py
```

### 4. PDF 导入失败

先预览解析结果：

```bash
python import_pdfs.py --dry-run
```

再检查：

- PDF 文件命名是否规范
- `data/` 目录结构是否正确
- `pdfplumber` 是否安装成功

## 后续建议

如果你准备继续把系统做专业一点，推荐下一步按这个顺序推进：

1. 把 `game_records` 再拆成 `games + batting_records + pitching_records`
2. 增加球队、赛季、比赛实体
3. 把胜投/败投/救援成功从单人记录提升为比赛级逻辑
4. 给 Prisma 补 migration，逐步接入 Node 管理端
5. 增加登录和权限控制

## 维护说明

如果你后续继续让我维护这个仓库，最重要的几个文件是：

- [database.py](/Users/baiyunxiao/Desktop/baseball-player-manager/database.py)
- [app.py](/Users/baiyunxiao/Desktop/baseball-player-manager/app.py)
- [migrate_profiles_sqlite.py](/Users/baiyunxiao/Desktop/baseball-player-manager/migrate_profiles_sqlite.py)
- [prisma/schema.prisma](/Users/baiyunxiao/Desktop/baseball-player-manager/prisma/schema.prisma)

这几个文件已经代表了当前项目的数据结构核心。
