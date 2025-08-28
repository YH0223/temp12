"use client"

import { useState } from "react"
import LoginPage from "@/components/login-page"
import SignupPage from "@/components/signup-page"
import { useRouter } from "next/navigation"

export default function AuthPage() {
    const [showSignup, setShowSignup] = useState(false)
    const router = useRouter()

    const handleLoginSuccess = () => { router.push("/") }
    const handleSignupSuccess = () => { setShowSignup(false) }

    return showSignup ? (
        <SignupPage
            onSignupSuccess={handleSignupSuccess}
            onBackToLogin={() => setShowSignup(false)}
        />
    ) : (
        <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onShowSignup={() => setShowSignup(true)}
        />
    )
}