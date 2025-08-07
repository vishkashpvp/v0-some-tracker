import "server-only"
import { cookies } from "next/headers"
import { sql } from "./db"

export interface AdminUser {
  id: number
  username: string
  role: 'admin' | 'user'
}

export async function verifyCredentials(username: string, password: string): Promise<AdminUser | null> {
  try {
    const users = await sql`
      SELECT id, username, role, password_hash FROM admin_users WHERE username = ${username}
    `
    
    if (users.length > 0 && users[0].password_hash === password) {
      return {
        id: users[0].id,
        username: users[0].username,
        role: users[0].role
      } as AdminUser
    }
    
    return null
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

export async function createSession(user: AdminUser) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const session = JSON.stringify({ 
    userId: user.id, 
    username: user.username, 
    role: user.role,
    expires: expires.toISOString() 
  })

  const cookieStore = cookies()
  cookieStore.set("admin-session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expires,
    sameSite: "lax",
    path: "/",
  })
}

export async function getSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("admin-session")

    if (!sessionCookie) return null

    const session = JSON.parse(sessionCookie.value)
    const expires = new Date(session.expires)

    if (expires < new Date()) {
      await deleteSession()
      return null
    }

    return { 
      id: session.userId, 
      username: session.username,
      role: session.role || 'user' 
    }
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

export async function deleteSession() {
  const cookieStore = cookies()
  cookieStore.delete("admin-session")
}

export async function verifyDeletePin(pin: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT setting_value FROM system_settings WHERE setting_key = 'delete_all_pin'
    `
    
    if (result.length > 0) {
      return result[0].setting_value === pin
    }
    
    return false
  } catch (error) {
    console.error("PIN verification error:", error)
    return false
  }
}

// Add helper function to check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  return session?.role === 'admin'
}

// New function to change user password
export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
  try {
    const user = await sql`SELECT username, password_hash FROM admin_users WHERE id = ${userId}`
    if (user.length === 0) return false

    if (user[0].password_hash === currentPassword) {
      await sql`UPDATE admin_users SET password_hash = ${newPassword} WHERE id = ${userId}`
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error changing password:", error);
    return false;
  }
}
