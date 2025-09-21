import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, name, profileImage } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { walletAddress }
    })

    if (existingUser) {
      // Update user if they exist
      const updatedUser = await db.user.update({
        where: { walletAddress },
        data: {
          name: name || existingUser.name,
          profileImage: profileImage || existingUser.profileImage,
          isOnline: true,
          lastSeen: new Date()
        }
      })
      return NextResponse.json(updatedUser)
    }

    // Create new user
    const user = await db.user.create({
      data: {
        walletAddress,
        name,
        profileImage,
        isOnline: true,
        lastSeen: new Date()
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (walletAddress) {
      // Get specific user
      const user = await db.user.findUnique({
        where: { walletAddress }
      })
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      return NextResponse.json(user)
    }

    // Get all users
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}