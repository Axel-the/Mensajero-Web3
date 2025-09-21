import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { sender, receiver, amount, currency, txHash, messageId } = await request.json()

    if (!sender || !receiver || !amount || !currency || !txHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if payment with this txHash already exists
    const existingPayment = await db.payment.findUnique({
      where: { txHash }
    })

    if (existingPayment) {
      return NextResponse.json(existingPayment)
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        sender,
        receiver,
        amount: parseFloat(amount),
        currency,
        txHash,
        status: 'completed',
        message: messageId
      },
      include: {
        senderUser: true,
        receiverUser: true
      }
    })

    // If messageId is provided, update the message to mark it as paid
    if (messageId) {
      await db.message.update({
        where: { id: messageId },
        data: {
          isPaid: true,
          amount: parseFloat(amount),
          currency,
          txHash
        }
      })
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')
    const txHash = searchParams.get('txHash')

    if (txHash) {
      // Get payment by transaction hash
      const payment = await db.payment.findUnique({
        where: { txHash },
        include: {
          senderUser: true,
          receiverUser: true
        }
      })
      
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      
      return NextResponse.json(payment)
    }

    if (userAddress) {
      // Get payments for user
      const payments = await db.payment.findMany({
        where: {
          OR: [
            { sender: userAddress },
            { receiver: userAddress }
          ]
        },
        include: {
          senderUser: true,
          receiverUser: true
        },
        orderBy: { timestamp: 'desc' }
      })

      return NextResponse.json(payments)
    }

    return NextResponse.json({ error: 'User address or transaction hash is required' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}