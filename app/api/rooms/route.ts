import { NextRequest, NextResponse } from 'next/server'
import { createRoom, listRooms } from '@/lib/room-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      hostId,
      roomId,
      skillDuration,
      speechDuration,
      voteDuration,
      roleConfig,
    } = body

    // 验证输入
    if (!hostId || !roomId || !roleConfig) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    if (!/^[A-Z0-9]{1,20}$/.test(roomId)) {
      return NextResponse.json(
        { error: '房间号格式不正确' },
        { status: 400 }
      )
    }

    const room = await createRoom(
      hostId,
      roomId,
      skillDuration,
      speechDuration,
      voteDuration,
      roleConfig
    )

    return NextResponse.json(room)
  } catch (error) {
    console.error('创建房间错误:', error)
    return NextResponse.json(
      { error: '创建房间失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const rooms = await listRooms(status || undefined)

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('列出房间错误:', error)
    return NextResponse.json(
      { error: '获取房间列表失败' },
      { status: 500 }
    )
  }
}
