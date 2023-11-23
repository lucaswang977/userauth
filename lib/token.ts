"use client"

export function getJwtToken() {
  return sessionStorage.getItem("jwt")
}

export function setJwtToken(token: string) {
  sessionStorage.setItem("jwt", token)
}

export function getRefreshToken() {
  return sessionStorage.getItem("refreshToken")
}

export function setRefreshToken(token: string) {
  sessionStorage.setItem("refreshToken", token)
}
