export type ActionResult =
  | {
      result: true
      reason?: string
    }
  | {
      result: false
      reason: string
    }

export type LoginResult = ActionResult & {
  token?: string
  refreshToken?: string
  refreshExpires?: Date
}

export type JwtPayload = {
  userId: string
  hashedFingerprint: string
}
