import type { NextRequest } from 'next/server'
import { listTransactions, postTransaction } from '@/modules/inventory/transactions/routes'
import { issueCreateSchema } from '@/modules/inventory/transactions/schemas'

type Context = { params: Promise<{ orgSlug: string }> }
export const GET = (request: NextRequest, context: Context) => listTransactions('ISSUE', request, context)
export const POST = (request: NextRequest, context: Context) => postTransaction('ISSUE', issueCreateSchema, request, context)
