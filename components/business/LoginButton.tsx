"use client"

import { Button } from "@/c/shadui/button"
import { CookieValueTypes, deleteCookie, getCookie } from "cookies-next"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function LoginButton() {
  const [jwt, setJwt] = useState<CookieValueTypes | undefined>()
  const router = useRouter()

  useEffect(() => {
    setJwt(getCookie("x-jwt"))
  }, [])

  return jwt ? (
    <Button
      onClick={() => {
        deleteCookie("x-jwt")
        setJwt(undefined)
      }}
    >
      Logout
    </Button>
  ) : (
    <Button
      onClick={() => {
        router.push("/login")
      }}
    >
      Login
    </Button>
  )
}

export default LoginButton
