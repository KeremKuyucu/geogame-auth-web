"use client"

import { useState, useEffect } from "react"
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/config" // Firebase config'i buradan alıyoruz
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input" // Input bileşenini ekliyoruz
import { motion, AnimatePresence } from "framer-motion"
import { User, Copy, RefreshCw, X, LogIn, Mail, KeyRound, Github, ArrowLeft } from "lucide-react"
import { Toaster, toast } from "react-hot-toast" // Toast bildirimleri için

// Çevirileri güncelledim
const translations = {
  en: {
    loginTitle: "Welcome to GeoGame",
    loginSubtitle: "Choose a method to sign in",
    googleLogin: "Continue with Google",
    githubLogin: "Continue with GitHub",
    emailLogin: "Continue with Email",
    guestLogin: "Continue as Guest",
    welcome: "Welcome",
    copyButton: "Sign in to the App",
    cancelButton: "Start Over",
    closeTabWarning: "Data copied! You can now return to the application.",
    closeTabButton: "Close Tab",
    orSeparator: "or",
    emailPlaceholder: "Enter your email",
    passwordPlaceholder: "Enter your password",
    signUp: "Sign Up",
    signIn: "Sign In",
    backButton: "Back",
    guestNamePrompt: "Enter your name for the leaderboard (optional)",
    loginSuccess: "Successfully logged in!",
    loginError: "Login failed. Please try again.",
  },
  tr: {
    loginTitle: "GeoGame'e Hoş Geldiniz",
    loginSubtitle: "Giriş yapmak için bir yöntem seçin",
    googleLogin: "Google ile Devam Et",
    githubLogin: "GitHub ile Devam Et",
    emailLogin: "E-posta ile Devam Et",
    guestLogin: "Misafir Olarak Devam Et",
    welcome: "Hoş Geldin",
    copyButton: "Uygulamaya Giriş Yap",
    cancelButton: "Yeniden Başla",
    closeTabWarning: "Veriler kopyalandı! Artık uygulamaya dönebilirsiniz.",
    closeTabButton: "Sekmeyi Kapat",
    orSeparator: "veya",
    emailPlaceholder: "E-posta adresinizi girin",
    passwordPlaceholder: "Şifrenizi girin",
    signUp: "Kayıt Ol",
    signIn: "Giriş Yap",
    backButton: "Geri",
    guestNamePrompt: "Sıralama için adınızı girin (isteğe bağlı)",
    loginSuccess: "Başarıyla giriş yapıldı!",
    loginError: "Giriş başarısız. Lütfen tekrar deneyin.",
  },
}

type UserData = {
  uid: string
  displayName: string | null
  email: string | null
  profilePicture: string | null
}

// Yeniden kullanılabilir giriş butonu bileşeni
const ProviderButton = ({ provider, icon, text, onClick, isLoading }: any) => (
  <Button
    disabled={isLoading}
    className={`flex items-center justify-center gap-3 w-full py-6 px-5 rounded-xl text-base font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70 
      ${provider === 'google' && 'bg-white hover:bg-gray-100 text-gray-800'}
      ${provider === 'github' && 'bg-gray-800 hover:bg-gray-900 text-white'}
      ${provider === 'email' && 'bg-indigo-600 hover:bg-indigo-700 text-white'}
      ${provider === 'guest' && 'bg-gray-500 hover:bg-gray-600 text-white'}`}
    onClick={onClick}
  >
    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : icon}
    <span>{text}</span>
  </Button>
)

export default function AuthPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [language, setLanguage] = useState("en")
  const [isLoading, setIsLoading] = useState<string | null>(null) // Hangi butonun yüklendiğini takip eder
  const [view, setView] = useState("main") // 'main', 'email', 'guest'

  useEffect(() => {
    setLanguage(navigator.language.startsWith("tr") ? "tr" : "en")
  }, [])

  const t = translations[language as keyof typeof translations]

  const handleLogin = async (loginFunction: Function, providerName: string) => {
    setIsLoading(providerName)
    try {
      const user = await loginFunction()
      if (!user) throw new Error("User object is null.")

      const userDataObj: UserData = {
        uid: user.uid,
        displayName: user.displayName || "User",
        email: user.email,
        profilePicture: user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.displayName || user.email || 'guest'}`,
      }
      setUserData(userDataObj)
      toast.success(t.loginSuccess)
      // loginCallback(userDataObj) // Backend'inize veri gönderme
    } catch (error: any) {
      console.error(`${providerName} login error:`, error)
      toast.error(error.message || t.loginError)
    } finally {
      setIsLoading(null)
    }
  }

  const googleSignIn = () => handleLogin(async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }, "google")

  const githubSignIn = () => handleLogin(async () => {
    const provider = new GithubAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }, "github")
  
  const guestSignIn = (name: string) => handleLogin(async () => {
      const result = await signInAnonymously(auth)
      return {...result.user, displayName: name || 'Guest'}
  }, "guest")

  const emailSignIn = (email: string, pass: string) => handleLogin(async () => {
      const result = await signInWithEmailAndPassword(auth, email, pass)
      return result.user
  }, "email_signin")
  
  const emailSignUp = (email: string, pass: string) => handleLogin(async () => {
      const result = await createUserWithEmailAndPassword(auth, email, pass)
      return result.user
  }, "email_signup")

  const copyToClipboard = () => {
      if (!userData) return;
      navigator.clipboard.writeText(JSON.stringify(userData, null, 2))
        .then(() => {
          // Mesajı daha açıklayıcı hale getirin
          toast.success("Kullanıcı verisi panoya kopyalandı! Ana uygulamaya dönebilirsiniz.");
        })
        .catch(err => {
          console.error("Copy failed:", err);
          toast.error("Veri kopyalanamadı!");
        });
  };

  // E-posta ve şifre formu bileşeni
  const EmailForm = () => {
      const [email, setEmail] = useState('')
      const [password, setPassword] = useState('')
      return(
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="space-y-4">
               <Button onClick={() => setView('main')} variant="ghost" className="text-white/70 hover:text-white"><ArrowLeft size={16} className="mr-2" /> {t.backButton}</Button>
               <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20}/>
                   <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={t.emailPlaceholder} className="bg-white/10 border-white/20 pl-10 text-white placeholder:text-white/50 h-14 rounded-xl"/>
               </div>
               <div className="relative">
                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20}/>
                   <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={t.passwordPlaceholder} className="bg-white/10 border-white/20 pl-10 text-white placeholder:text-white/50 h-14 rounded-xl"/>
               </div>
               <div className="flex gap-4">
                   <Button onClick={() => emailSignIn(email, password)} disabled={!!isLoading} className="w-full h-12 bg-indigo-500 hover:bg-indigo-600">{isLoading === 'email_signin' ? <RefreshCw className="animate-spin"/> : t.signIn}</Button>
                   <Button onClick={() => emailSignUp(email, password)} disabled={!!isLoading} className="w-full h-12 bg-green-500 hover:bg-green-600">{isLoading === 'email_signup' ? <RefreshCw className="animate-spin"/> : t.signUp}</Button>
               </div>
          </motion.div>
      )
  }
  
  // Misafir giriş formu bileşeni
  const GuestForm = () => {
      const [name, setName] = useState('')
      return(
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="space-y-4">
               <Button onClick={() => setView('main')} variant="ghost" className="text-white/70 hover:text-white"><ArrowLeft size={16} className="mr-2" /> {t.backButton}</Button>
               <p className="text-center text-white/80">{t.guestNamePrompt}</p>
               <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20}/>
                   <Input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="e.g. 'ProGamer'" className="bg-white/10 border-white/20 pl-10 text-white placeholder:text-white/50 h-14 rounded-xl"/>
               </div>
               <Button onClick={() => guestSignIn(name)} disabled={!!isLoading} className="w-full h-12 bg-gray-500 hover:bg-gray-600">
                    {isLoading === 'guest' ? <RefreshCw className="animate-spin"/> : <LogIn size={18} className="mr-2"/>}
                    {t.guestLogin}
                </Button>
          </motion.div>
      )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white p-4 overflow-hidden">
      <Toaster position="top-center" toastOptions={{
          className: 'bg-gray-800 text-white border border-white/20',
          success: { duration: 3000 },
          error: { duration: 5000 },
      }}/>
      
      {!userData ? (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
        >
          <Card className="bg-black/20 backdrop-blur-lg rounded-2xl shadow-xl p-8 w-full border-none">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold">{t.loginTitle}</h1>
              <p className="text-white/70">{t.loginSubtitle}</p>
            </div>
            
            <AnimatePresence mode="wait">
                {view === 'main' && (
                     <motion.div key="main" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="space-y-4">
                        <ProviderButton provider="google" icon={<img src="https://cdn.glitch.global/e74d89f5-045d-4ad2-94c7-e2c99ed95318/google?v=1739613007196" alt="Google" className="w-6 h-6"/>} text={t.googleLogin} onClick={googleSignIn} isLoading={isLoading === 'google'}/>
                        <ProviderButton provider="github" icon={<Github className="w-6 h-6"/>} text={t.githubLogin} onClick={githubSignIn} isLoading={isLoading === 'github'}/>
                        <div className="relative flex items-center justify-center my-2">
                           <div className="w-full border-t border-white/20"></div>
                           <div className="relative px-2 text-sm text-white/50 bg-black/20">{t.orSeparator}</div>
                        </div>
                        <ProviderButton provider="email" icon={<Mail className="w-6 h-6"/>} text={t.emailLogin} onClick={() => setView('email')} isLoading={false}/>
                        <ProviderButton provider="guest" icon={<User className="w-6 h-6"/>} text={t.guestLogin} onClick={() => setView('guest')} isLoading={false}/>
                     </motion.div>
                )}
                {view === 'email' && <EmailForm key="email"/>}
                {view === 'guest' && <GuestForm key="guest"/>}
            </AnimatePresence>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full border-none text-center">
                <img src={userData.profilePicture!} alt="Profile" className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 object-cover shadow-lg"/>
                <h2 className="text-2xl font-bold mt-4">{`${t.welcome}, ${userData.displayName}!`}</h2>
                <p className="text-white/60 mb-6">{userData.email}</p>
                <div className="flex gap-4">
                    <Button className="flex-1 bg-white/10 hover:bg-white/20" onClick={() => window.location.reload()}><RefreshCw className="w-4 h-4 mr-2" />{t.cancelButton}</Button>
                    <Button className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={copyToClipboard}><Copy className="w-4 h-4 mr-2" />{t.copyButton}</Button>
                </div>
            </Card>
        </motion.div>
      )}
    </div>
  )
}