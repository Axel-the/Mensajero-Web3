import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { content, senderId, receiverId, conversationId, encrypted = true, isPaid = false, amount, currency, txHash } = await request.json()

    if (!content || !senderId || !receiverId || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify conversation exists and user is part of it
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.participant1 !== senderId && conversation.participant2 !== senderId) {
      return NextResponse.json({ error: 'User not part of conversation' }, { status: 403 })
    }

    // Create message
    const message = await db.message.create({
      data: {
        content,
        senderId,
        receiverId,
        conversationId,
        encrypted,
        isPaid,
        amount: isPaid ? amount : null,
        currency: isPaid ? currency : null,
        txHash: isPaid ? txHash : null
      },
      include: {
        sender: true,
        receiver: true,
        conversation: true
      }
    })

    // Update conversation last message
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content,
        lastMessageAt: new Date()
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const userAddress = searchParams.get('userAddress')

    if (conversationId) {
      // Get messages for specific conversation
      const messages = await db.message.findMany({
        where: { conversationId },
        include: {
          sender: true,
          receiver: true
        },
        orderBy: { timestamp: 'asc' }
      })

      return NextResponse.json(messages)
    }

    if (userAddress) {
      // Get messages for user
      const messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: userAddress },
            { receiverId: userAddress }
          ]
        },
        include: {
          sender: true,
          receiver: true,
          conversation: true
        },
        orderBy: { timestamp: 'desc' }
      })

      return NextResponse.json(messages)
    }

    return NextResponse.json({ error: 'Conversation ID or user address is required' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}