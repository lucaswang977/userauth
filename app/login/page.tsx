import LoginForm from "@/c/business/LoginForm"
import login from "@/l/actions"
import { slogger } from "@/l/utility"

export default function Login() {
  return (
    <LoginForm
      handleLogin={async (email, password) => {
        "use server"

        const [result, message] = await login(email, password)
        if (result) {
          slogger.info(
            "login success with %s(%s), msg: %s",
            email,
            password,
            message,
          )
        } else {
          slogger.info(
            "login failed with %s(%s), msg: %s",
            email,
            password,
            message,
          )
        }

        return [result, message]
      }}
    />
  )
}
