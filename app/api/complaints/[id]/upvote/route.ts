import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const complaintId = resolvedParams.id;

    // 1. Auth check
    const authHeader = request.headers.get('authorization');
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = request.cookies.get('civicresolve-token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;

    // 2. Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true, displayId: true }
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // 3. Create upvote and timeline entry in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the upvote (will throw if user already upvoted due to unique constraint)
      await tx.complaintUpvote.create({
        data: {
          complaintId,
          userId,
        }
      });

      // Update the timeline of the parent complaint to note the additional report
      await tx.complaintTimeline.create({
        data: {
          complaintId,
          status: 'LINKED',
          message: `Another citizen reported this same issue.`,
        }
      });

      // Increment the upvotes count on the Complaint model
      await tx.complaint.update({
        where: { id: complaintId },
        data: { upvotesCount: { increment: 1 } }
      });
    });

    return NextResponse.json({ success: true, message: 'Successfully linked to complaint' });

  } catch (error: any) {
    console.error('Upvote error:', error);
    // Handle Prisma unique constraint violation (P2002)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already linked to this complaint' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
