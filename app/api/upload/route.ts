import { decodeAndVerifyJwt } from "@/l/user"
import { slogger } from "@/l/utility"

/* eslint-disable import/prefer-default-export */
export async function POST(request: Request) {
  const json = await request.json()
  slogger.info(json)

  const decoded = decodeAndVerifyJwt(token)
  if (decoded) {
    return Response.json({ result: true, userId: decoded.userId })
  }

  return Response.json({ result: false })
}
