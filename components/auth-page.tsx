"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, RefreshCw, Mail, KeyRound, ArrowLeft, Send } from "lucide-react"
import { Toaster, toast } from "react-hot-toast"

// --- SUPABASE CONFIG ---
// Bu değişkenleri .env dosyanızdan çektiğinizden emin olun
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// --- ÇEVİRİLER ---
const translations = {
  en: {
    loginTitle: "KeremKK Auth",
    loginSubtitle: "Sign in with your email",
    welcome: "Welcome",
    copyButton: "Sign in to the App",
    cancelButton: "Sign Out",
    emailPlaceholder: "Enter your email",
    passwordPlaceholder: "Enter your password",
    signUp: "Sign Up",
    signIn: "Sign In",
    forgotPassword: "Forgot Password?",
    resetTitle: "Reset Password",
    resetDesc: "Enter your email to receive a reset link",
    sendLink: "Send Reset Link",
    backToLogin: "Back to Login",
    loginSuccess: "Successfully logged in!",
    loginError: "Login failed. Please check your credentials.",
    resetSuccess: "Reset link sent! Check your email.",
    copyWarning: "User data copied! Return to the app.",
    checkEmail: "Check your email for the confirmation link!",
  },
  tr: {
    loginTitle: "KeremKK Auth",
    loginSubtitle: "E-posta adresinizle giriş yapın",
    welcome: "Hoş Geldin",
    copyButton: "Uygulamaya Giriş Yap",
    cancelButton: "Çıkış Yap",
    emailPlaceholder: "E-posta adresinizi girin",
    passwordPlaceholder: "Şifrenizi girin",
    signUp: "Kayıt Ol",
    signIn: "Giriş Yap",
    forgotPassword: "Şifremi Unuttum",
    resetTitle: "Şifre Sıfırlama",
    resetDesc: "Sıfırlama linki için e-postanızı girin",
    sendLink: "Link Gönder",
    backToLogin: "Girişe Dön",
    loginSuccess: "Başarıyla giriş yapıldı!",
    loginError: "Giriş başarısız. Bilgilerinizi kontrol edin.",
    resetSuccess: "Sıfırlama linki gönderildi! E-postanızı kontrol edin.",
    copyWarning: "Veriler kopyalandı! Uygulamaya dönebilirsiniz.",
    checkEmail: "Onay linki için e-postanızı kontrol edin!",
  },
}

type UserData = {
  uid: string
  displayName: string | null
  email: string | null
  profilePicture: string | null
  accessToken?: string | null
  refreshToken?: string | null
}

export default function AuthPage() {
  // State Yönetimi
  const [userData, setUserData] = useState<UserData | null>(null)
  const [language, setLanguage] = useState("en")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [view, setView] = useState<'login' | 'reset'>('login')

  // Form Verileri
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Tarayıcı dilini algıla
    setLanguage(navigator.language.startsWith("tr") ? "tr" : "en")

    // Oturum kontrolü
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        processUser(session.user, session.access_token, session.refresh_token)
      }
    }
    checkUser()

    // Auth durum değişikliğini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !userData) {
        processUser(session.user, session.access_token, session.refresh_token)
      } else if (!session?.user) {
        setUserData(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const t = translations[language as keyof typeof translations]

  // Supabase kullanıcısını UI formatına çevir
  const processUser = (user: any, accessToken?: string, refreshToken?: string) => {
    const metadata = user.user_metadata || {}
    const userDataObj: UserData = {
      uid: user.id,
      displayName: metadata.full_name || user.email?.split('@')[0] || "User",
      email: user.email || null,
      profilePicture: metadata.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user.id}`,
      accessToken: accessToken,
      refreshToken: refreshToken
    }
    setUserData(userDataObj)
    loginCallback(userDataObj)
  }

  // Backend'e bildirim (Callback)
  const loginCallback = async (userData: UserData) => {
    try {
      await fetch("https://geogame-api.keremkk.com.tr/api/login/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
    } catch (error) {
      console.error("Error during request:", error)
    }
  }

  // --- İŞLEM FONKSİYONLARI ---

  // 1. Giriş Yap
  const emailSignIn = async () => {
    if (!email || !password) return;
    setIsLoading("signin")
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success(t.loginSuccess)
    } catch (error: any) {
      toast.error(error.message || t.loginError)
    } finally {
      setIsLoading(null)
    }
  }

  // 2. Kayıt Ol
  const emailSignUp = async () => {
    if (!email || !password) return;
    setIsLoading("signup")
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      if (data.user && !data.session) {
        toast.success(t.checkEmail)
      } else {
        toast.success(t.loginSuccess)
      }
    } catch (error: any) {
      toast.error(error.message || t.loginError)
    } finally {
      setIsLoading(null)
    }
  }

  // 3. Şifre Sıfırlama (Deep Link Entegreli)
  const resetPassword = async () => {
    if (!email) return;
    setIsLoading("reset")
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // BURASI ÇOK ÖNEMLİ: Mobil uygulamanı açacak adres
        redirectTo: 'com.keremkuyucu.geogame://reset-password',
      })
      if (error) throw error
      toast.success(t.resetSuccess)
      setView('login') // Başarılı olunca giriş ekranına dön
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(null)
    }
  }

  // 4. Çıkış Yap
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserData(null);
    setEmail('');
    setPassword('');
    window.location.reload();
  };

  // 5. Verileri Kopyala
  const copyToClipboard = () => {
    if (!userData) return;
    navigator.clipboard.writeText(JSON.stringify({ user: userData }, null, 2))
      .then(() => toast.success(t.copyWarning));
  };

  // --- UI RENDER ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white p-4 overflow-hidden">
      <Toaster position="top-center" toastOptions={{ className: 'bg-gray-800 text-white border border-white/20' }} />

      {!userData ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Card className="bg-black/20 backdrop-blur-lg rounded-2xl shadow-xl p-8 w-full border-none">

            <AnimatePresence mode="wait">
              {/* --- GİRİŞ EKRANI --- */}
              {view === 'login' ? (
                <motion.div key="login" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}>
                  <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">{t.loginTitle}</h1>
                    <p className="text-white/70">{t.loginSubtitle}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder={t.emailPlaceholder}
                        className="bg-white/10 border-white/20 pl-10 text-white placeholder:text-white/50 h-14 rounded-xl"
                      />
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                      <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder={t.passwordPlaceholder}
                        className="bg-white/10 border-white/20 pl-10 text-white placeholder:text-white/50 h-14 rounded-xl"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => setView('reset')} className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
                        {t.forgotPassword}
                      </button>
                    </div>

                    <div className="flex gap-4 pt-2">
                      <Button
                        onClick={emailSignIn}
                        disabled={!!isLoading || !email || !password}
                        className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-medium"
                      >
                        {isLoading === 'signin' && <RefreshCw className="animate-spin mr-2" />} {t.signIn}
                      </Button>
                      <Button
                        onClick={emailSignUp}
                        disabled={!!isLoading || !email || !password}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl font-medium"
                      >
                        {isLoading === 'signup' && <RefreshCw className="animate-spin mr-2" />} {t.signUp}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (

                /* --- ŞİFRE SIFIRLAMA EKRANI --- */
                <motion.div key="reset" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }}>
                  <Button onClick={() => setView('login')} variant="ghost" className="mb-4 text-white/70 hover:text-white pl-0">
                    <ArrowLeft size={16} className="mr-2" /> {t.backToLogin}
                  </Button>
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold">{t.resetTitle}</h2>
                    <p className="text-white/70 text-sm mt-2">{t.resetDesc}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder={t.emailPlaceholder}
                        className="bg-white/10 border-white/20 pl-10 text-white placeholder:text-white/50 h-14 rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={resetPassword}
                      disabled={!!isLoading || !email}
                      className="w-full h-12 bg-orange-500 hover:bg-orange-600 rounded-xl font-medium"
                    >
                      {isLoading === 'reset' ? <RefreshCw className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                      {t.sendLink}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      ) : (
        /* --- GİRİŞ BAŞARILI EKRANI --- */
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full border-none text-center">
            <img src={userData.profilePicture!} alt="Profile" className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 object-cover shadow-lg" />
            <h2 className="text-2xl font-bold mt-4">{`${t.welcome}, ${userData.displayName}!`}</h2>
            <p className="text-white/60 mb-6">{userData.email}</p>
            <div className="flex gap-4">
              <Button className="flex-1 bg-white/10 hover:bg-white/20" onClick={handleSignOut}>
                <RefreshCw className="w-4 h-4 mr-2" />{t.cancelButton}
              </Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />{t.copyButton}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}