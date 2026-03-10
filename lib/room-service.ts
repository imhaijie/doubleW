import { createClient } from '@/lib/supabase/server'
import { GameRoom, RoleConfig } from '@/lib/types'
import { headers } from 'next/headers'

export async function createRoom(
  hostId: string,
  roomId: string,
  skillDuration: number,
  speechDuration: number,
  voteDuration: number | null,
  roleConfig: RoleConfig
): Promise<GameRoom> {
  const supabase = await createClient()

  const room: GameRoom = {
    id: `${hostId}-${Date.now()}`,
    roomId,
    hostId,
    players: [],
    currentPhase: 'waiting',
    nightRound: 0,
    dayRound: 0,
    gameLog: [],
    skillDuration,
    speechDuration,
    voteDuration: voteDuration || 0,
    roleConfig,
    currentNightData: {
      werewolfTargets: new Map(),
      deathList: [],
    },
    currentDayData: {
      deadByNight: [],
      speakingOrder: [],
      currentSpeaker: 0,
      voteList: new Map(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 将房间信息存储到数据库
  const { data, error } = await supabase.from('rooms').insert([
    {
      room_id: roomId,
      host_id: hostId,
      state: JSON.stringify(room),
      status: 'waiting',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])

  if (error) {
    throw new Error(`创建房间失败: ${error.message}`)
  }

  return room
}

export async function getRoom(roomId: string): Promise<GameRoom | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('state')
    .eq('room_id', roomId)
    .single()

  if (error) {
    console.error('获取房间失败:', error)
    return null
  }

  if (data && typeof data.state === 'string') {
    return JSON.parse(data.state)
  }

  return null
}

export async function updateRoomState(roomId: string, room: GameRoom): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rooms')
    .update({
      state: JSON.stringify(room),
      status: room.currentPhase,
      updated_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)

  if (error) {
    throw new Error(`更新房间失败: ${error.message}`)
  }
}

export async function deleteRoom(roomId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('room_id', roomId)

  if (error) {
    throw new Error(`删除房间失败: ${error.message}`)
  }
}

export async function listRooms(status?: string): Promise<GameRoom[]> {
  const supabase = await createClient()

  let query = supabase.from('rooms').select('state')

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('列出房间失败:', error)
    return []
  }

  return (data || [])
    .map(room => {
      if (typeof room.state === 'string') {
        return JSON.parse(room.state)
      }
      return null
    })
    .filter(Boolean)
}

export async function saveGameRecord(
  roomId: string,
  hostId: string,
  winner: 'good' | 'werewolf',
  gameLog: any[]
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('game_records').insert([
    {
      room_id: roomId,
      host_id: hostId,
      winner,
      game_log: JSON.stringify(gameLog),
      created_at: new Date().toISOString(),
    },
  ])

  if (error) {
    console.error('保存游戏记录失败:', error)
  }
}
