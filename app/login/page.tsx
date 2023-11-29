import LoginForm from "@/c/business/LoginForm"
import { loginByEmailPwd } from "@/l/actions"
import { slogger } from "@/l/utility"

export default function LoginPage() {
  return (
    <LoginForm
      handleLogin={async (email, password) => {
        "use server"

        const result = await loginByEmailPwd(email, password)
        if (result.result && result.token) {
          slogger.info(
            "login success with %s(%s), token: %s",
            email,
            password,
            result.token,
          )
          return [result.result, result.token]
        }
        slogger.info(
          "login failed with %s(%s), msg: %s",
          email,
          password,
          result.reason,
        )

        return [result.result, result.reason ? result.reason : ""]
      }}
    />
  )
}
