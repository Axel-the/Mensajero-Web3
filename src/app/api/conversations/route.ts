import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { participant1, participant2 } = await request.json()

    if (!participant1 || !participant2) {
      return NextResponse.json({ error: 'Both participants are required' }, { status: 400 })
    }

    if (participant1 === participant2) {
      return NextResponse.json({ error: 'Cannot create conversation with yourself' }, { status: 400 })
    }

    // Check if conversation already exists
    const existingConversation = await db.conversation.findFirst({
      where: {
        OR: [
          { participant1, participant2 },
          { participant1: participant2, participant2: participant1 }
        ]
      }
    })

    if (existingConversation) {
      return NextResponse.json(existingConversation)
    }

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        participant1,
        participant2
      },
      include: {
        user1: true,
        user2: true
      }
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    if (!userAddress) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 })
    }

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { participant1: userAddress },
          { participant2: userAddress }
        ]
      },
      include: {
        user1: true,
        user2: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participant1 === userAddress ? conv.user2 : conv.user1
      const lastMessage = conv.messages[0]
      
      return {
        id: conv.id,
        name: otherUser.name || otherUser.walletAddress,
        address: otherUser.walletAddress,
        lastMessage: lastMessage?.content || '',
        timestamp: lastMessage?.timestamp || conv.createdAt,
        unread: 0, // TODO: Calculate unread messages
        online: otherUser.isOnline
      }
    })

    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}