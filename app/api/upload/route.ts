// We simply save file in the public folder
// https://codersteps.com/articles/building-a-file-uploader-from-scratch-with-next-js-app-directory

// TODO: Until now we cannot unit test the App router API using node-mock-http

import { writeFile } from "fs/promises"
import { decodeAndVerifyJwt } from "@/l/user"

export async function POST(request: Request) {
  const formData = await request.formData()
  const token = formData.get("token")
  const file = formData.get("file") as Blob
  // TODO: Check fingerprint
  if (token && file) {
    const decoded = decodeAndVerifyJwt(token.toString())
    // TODO: Generate filename and url
    if (decoded) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      await writeFile(`public/${filename}`, buffer)
      return Response.json({ result: true, file: filename })
    }
  }
  return Response.json({ result: false }, { status: 400 })
}
