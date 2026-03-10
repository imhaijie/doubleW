"use server"

import { createClient } from '@/lib/supabase/server'
import { RoleConfig } from '@/lib/types'

export interface RoomData {
  id: string
  room_code: string
  host_player_id: string
  settings: {
    skillDuration: number
    speechDuration: number
    voteDuration: number
    roleConfig: RoleConfig
  }
  status: string
  created_at: string
}

export async function createRoom(
  hostPlayerId: string,
  roomCode: string,
  skillDuration: number,
  speechDuration: number,
  voteDuration: number,
  roleConfig: RoleConfig
): Promise<RoomData> {
  const supabase = await createClient()

  const settings = {
    skillDuration,
    speechDuration,
    voteDuration,
    roleConfig
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      room_code: roomCode,
      host_player_id: hostPlayerId,
      settings,
      status: 'waiting'
    })
    .select()
    .single()

  if (error) {
    console.error('创建房间失败:', error)
    throw new Error(`创建房间失败: ${error.message}`)
  }

  return data as RoomData
}

export async function getRoomByCode(roomCode: string): Promise<RoomData | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_code', roomCode)
    .single()

  if (error) {
    console.error('获取房间失败:', error)
    return null
  }

  return data as RoomData
}

export async function getRoomById(roomId: string): Promise<RoomData | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error) {
    console.error('获取房间失败:', error)
    return null
  }

  return data as RoomData
}

export async function updateRoomStatus(roomId: string, status: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rooms')
    .update({ status })
    .eq('id', roomId)

  if (error) {
    throw new Error(`更新房间状态失败: ${error.message}`)
  }
}

export async function finishRoom(roomId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rooms')
    .update({ 
      status: 'finished',
      finished_at: new Date().toISOString()
    })
    .eq('id', roomId)

  if (error) {
    throw new Error(`结束房间失败: ${error.message}`)
  }
}

export async function deleteRoom(roomId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)

  if (error) {
    throw new Error(`删除房间失败: ${error.message}`)
  }
}

export async function listRooms(status?: string): Promise<RoomData[]> {
  const supabase = await createClient()

  let query = supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('列出房间失败:', error)
    return []
  }

  return (data || []) as RoomData[]
}

export async function saveGameRecord(
  roomId: string,
  players: any[],
  actionLog: any[],
  winner: 'villagers' | 'werewolves'
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('game_records')
    .insert({
      room_id: roomId,
      players,
      action_log: actionLog,
      winner
    })

  if (error) {
    console.error('保存游戏记录失败:', error)
  }
}
