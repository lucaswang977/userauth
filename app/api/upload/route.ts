// https://github.com/vercel/examples/tree/main/solutions/aws-s3-image-upload

// TODO: We can still use server action to calling S3's createPresigned api

import { decodeAndVerifyJwt } from "@/l/user"

export async function POST(request: Request) {
  const json = await request.json()
  const { token } = json as { token: string }

  const decoded = decodeAndVerifyJwt(token)
  if (decoded) {
    return Response.json({ result: true, userId: decoded.userId })
  }

  return Response.json({ result: false }, { status: 400 })
}
