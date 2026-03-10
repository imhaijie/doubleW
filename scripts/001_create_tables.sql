-- 狼人杀游戏数据库表结构

-- 房间表
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  host_player_id TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{
    "skillTime": 20,
    "speakTime": 10,
    "voteTime": 60,
    "roles": {
      "werewolf": 2,
      "seer": 1,
      "witch": 1,
      "hunter": 1,
      "guard": 1,
      "villager": 2
    }
  }',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- 游戏记录表（用于复盘）
CREATE TABLE IF NOT EXISTS game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  players JSONB NOT NULL,
  action_log JSONB NOT NULL DEFAULT '[]',
  winner TEXT CHECK (winner IN ('villagers', 'werewolves')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 room_code 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_records_room_id ON game_records(room_id);

-- 启用 RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;

-- 房间表策略：允许所有人读取和创建（游戏不需要用户认证）
CREATE POLICY "rooms_select_all" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert_all" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update_all" ON rooms FOR UPDATE USING (true);
CREATE POLICY "rooms_delete_all" ON rooms FOR DELETE USING (true);

-- 游戏记录表策略
CREATE POLICY "game_records_select_all" ON game_records FOR SELECT USING (true);
CREATE POLICY "game_records_insert_all" ON game_records FOR INSERT WITH CHECK (true);
CREATE POLICY "game_records_update_all" ON game_records FOR UPDATE USING (true);
