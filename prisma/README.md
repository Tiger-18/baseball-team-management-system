# Prisma 数据模型

这个目录提供了当前项目的 Prisma 标准 schema，目标是把数据库结构固定为：

- `players`：只放球员主档案和角色信息
- `fielder_profiles`：场员/野手的打击与守备汇总
- `pitcher_profiles`：投手的投球汇总
- `game_records`：每场比赛的原始记录
- `positions` / `player_positions`：守备位置

当前 Flask 运行时仍然使用 SQLAlchemy 访问 SQLite，但数据结构已经和这里的 Prisma schema 对齐。

如果后续你要接 Prisma Client，可以先准备环境变量：

```bash
DATABASE_URL="file:../instance/baseball_players.db"
```

常见后续步骤：

```bash
npx prisma generate
npx prisma db pull
```

如果你准备把后端进一步拆成 Flask API + Node/Next.js 管理端，这个 schema 可以直接作为统一的数据模型起点。
