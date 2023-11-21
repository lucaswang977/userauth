"use client"

import { Button } from "@/c/shadui/button"
import { Input } from "@/c/shadui/input"
import { clogger } from "@/l/utility"
import { setCookie } from "cookies-next"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface LoginFormProps {
  handleLogin: (email: string, password: string) => Promise<[boolean, string]>
}

function LoginForm({ handleLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex space-x-1">
        <Input
          value={email}
          onChange={(e) => {
            setEmail(e.currentTarget.value)
          }}
        />
      </div>
      <div className="flex space-x-1">
        <Input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.currentTarget.value)
          }}
        />
      </div>
      <Button
        onClick={async () => {
          const [result, message] = await handleLogin(email, password)

          clogger.info(
            "login with: %s(%s), result: %s(%s)",
            email,
            password,
            result,
            message,
          )
          if (result) {
            setCookie("x-jwt", message)
            router.push("/")
          }
        }}
      >
        Login
      </Button>
    </div>
  )
}

export default LoginForm
