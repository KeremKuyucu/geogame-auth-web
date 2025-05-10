"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { User, Copy, RefreshCw } from "lucide-react"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhMZ1WyPKmOv1CD8ZF6tpd2tHXAkvrm6Y",
  authDomain: "geogamekk.firebaseapp.com",
  projectId: "geogamekk",
  storageBucket: "geogamekk.firebasestorage.app",
  messagingSenderId: "422602946138",
  appId: "1:422602946138:web:591cfe5753d95d0818ca63",
  measurementId: "G-8TJH0F54N3",
}

// Translations
const translations = {
  en: {
    loginTitle: "GeoGame Login",
    loginSubtitle: "Sign in to continue to GeoGame",
    googleLogin: "Continue with Google",
    guestLogin: "Continue as Guest",
    warningGuest: "You are logging in as a guest. You can use all features by logging in with your Google account.",
    enterName: "Please enter your name. If you don't want to join the ranking, you can leave it blank.",
    welcome: "Welcome",
    copyButton: "Copy and Login",
    cancelButton: "Start Over",
    warningCopy: "If the site cannot be closed, copy the Json below and return to the application.",
  },
  tr: {
    loginTitle: "GeoGame Girişi",
    loginSubtitle: "GeoGame'e devam etmek için giriş yapın",
    googleLogin: "Google ile Devam Et",
    guestLogin: "Misafir Olarak Devam Et",
    warningGuest:
      "Misafir olarak giriş yapıyorsunuz. Google hesabınızla giriş yaparak tüm özellikleri kullanabilirsiniz.",
    enterName: "Lütfen adınızı girin. Eğer sıralamaya girmek istemiyorsanız, adınızı boş bırakabilirsiniz.",
    welcome: "Hoşgeldin",
    copyButton: "Kopyala ve Giriş Yap",
    cancelButton: "Yeniden Başla",
    warningCopy: "Site kapatılamazsa, aşağıdaki Json'u kopyalayıp uygulamaya dönün.",
  },
}

type UserData = {
  uid: string
  displayName: string
  profilePicture: string
}

export default function AuthPage() {
  const [app, setApp] = useState<any>(null)
  const [auth, setAuth] = useState<any>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [showCopyWarning, setShowCopyWarning] = useState(false)
  const [language, setLanguage] = useState("en")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Initialize Firebase
    const firebaseApp = initializeApp(firebaseConfig)
    setApp(firebaseApp)
    setAuth(getAuth(firebaseApp))

    // Set language based on browser
    setLanguage(navigator.language.startsWith("tr") ? "tr" : "en")
  }, [])

  const loginCallback = async (userData: UserData) => {
    try {
      const response = await fetch("https://keremkk.glitch.me/geogame/login/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()
      console.log("Server response:", data)
    } catch (error) {
      console.error("Error during request:", error)
    }
  }

  const googleSignIn = async () => {
    if (!auth) return
    setIsLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      if (!user) {
        console.error("Google login failed: User object not found.")
        alert("Google login failed!")
        setIsLoading(false)
        return
      }

      // Get display name with priority
      const displayName = user.reloadUserInfo?.providerUserInfo?.[0]?.displayName || user.displayName || "User"

      // Get profile picture
      const profilePicture =
        user.photoURL || "https://cdn.glitch.global/e74d89f5-045d-4ad2-94c7-e2c99ed95318/2815428.png?v=1738114346363"

      const userDataObj = {
        uid: user.uid,
        displayName: displayName,
        profilePicture: profilePicture,
      }

      setUserData(userDataObj)
      await loginCallback(userDataObj)
    } catch (error: any) {
      console.error("Google login error:", error.code, error.message)
      alert(`Google login failed! Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const guestSignIn = async () => {
    if (!auth) return
    setIsLoading(true)

    try {
      const userName = prompt(translations[language as keyof typeof translations].enterName)
      setShowWarning(true)

      const result = await signInAnonymously(auth)
      const user = result.user
      const userDataObj = {
        uid: user.uid,
        displayName: userName || "Misafir",
        profilePicture: "https://cdn.glitch.global/e74d89f5-045d-4ad2-94c7-e2c99ed95318/2815428.png?v=1738114346363",
      }

      setUserData(userDataObj)
      await loginCallback(userDataObj)
    } catch (error) {
      console.error("Guest login error:", error)
      alert("Guest login failed!")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!userData) return

    const formattedData = {
      user: userData,
    }

    const jsonString = JSON.stringify(formattedData, null, 2)
    setShowCopyWarning(true)

    navigator.clipboard.writeText(jsonString).then(() => {
      window.close()
    })
  }

  const t = translations[language as keyof typeof translations]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/5 backdrop-blur-sm"
              style={{
                width: Math.random() * 300 + 50,
                height: Math.random() * 300 + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Globe icon */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-white"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white/90">GeoGame</h1>
        </motion.div>
      </div>

      {/* Warning messages */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/90 backdrop-blur-sm text-white p-4 mb-5 rounded-lg font-medium max-w-md w-full shadow-lg"
        >
          <p>{t.warningGuest}</p>
        </motion.div>
      )}

      {showCopyWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/90 backdrop-blur-sm text-white p-4 mb-5 rounded-lg font-medium max-w-md w-full shadow-lg"
        >
          <p>{t.warningCopy}</p>
        </motion.div>
      )}

      {/* Main content */}
      {!userData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-bl-full -z-10" />

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                {t.loginTitle}
              </h1>
              <p className="text-white/70">{t.loginSubtitle}</p>
            </div>

            <div className="space-y-4">
              <Button
                disabled={isLoading}
                className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-100 text-gray-800 py-6 px-5 rounded-xl text-base font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                onClick={googleSignIn}
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <img
                    src="https://cdn.glitch.global/e74d89f5-045d-4ad2-94c7-e2c99ed95318/google?v=1739613007196"
                    alt="Google Logo"
                    className="w-5 h-5"
                  />
                )}
                <span>{t.googleLogin}</span>
              </Button>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative px-4 text-sm text-white/50 bg-transparent">
                  {language === "tr" ? "veya" : "or"}
                </div>
              </div>

              <Button
                disabled={isLoading}
                className="flex items-center justify-center gap-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 px-5 rounded-xl text-base font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                onClick={guestSignIn}
              >
                {isLoading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <User className="w-5 h-5" />}
                <span>{t.guestLogin}</span>
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full border-none">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-md opacity-70"></div>
                <img
                  src={userData.profilePicture || "/placeholder.svg"}
                  alt="User Profile Picture"
                  className="relative w-24 h-24 rounded-full border-4 border-white/30 object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold mt-4 text-white">{`${t.welcome}, ${userData.displayName}!`}</h2>
            </div>

            <div className="bg-black/30 border border-white/20 p-5 rounded-xl font-mono text-sm break-all w-full mb-6 text-white/80 max-h-40 overflow-y-auto">
              {JSON.stringify(userData, null, 2)}
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-5 rounded-xl font-medium transition-all"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t.cancelButton}
              </Button>

              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                onClick={copyToClipboard}
              >
                <Copy className="w-4 h-4 mr-2" />
                {t.copyButton}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
