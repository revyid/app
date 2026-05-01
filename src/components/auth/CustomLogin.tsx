import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Fingerprint,
  Github,
  X,
  User,
} from 'lucide-react';
import { authenticateWithPasskey, isWebAuthnSupported } from '@/lib/webauthn';
import {
  register as authRegister,
  login as authLogin,
  oauthLogin,
  passkeyLogin,
  getStoredToken,
} from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button, IconButton } from '@/components/ui/button';
import {
  bottomSheetContent,
  modalBackdrop,
  shakeError,
  SPRING_BOUNCY,
  SPRING_SNAPPY,
  SPRING_DEFAULT,
} from '@/lib/motion-presets';

const FloatingInput = ({
  id,
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  isFocused,
  error,
  label,
  icon: Icon,
  autoComplete,
  required = true,
  rightElement,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  error?: string;
  label: string;
  icon: React.ElementType;
  autoComplete?: string;
  required?: boolean;
  rightElement?: React.ReactNode;
}) => (
  <div className="relative">
    <motion.div
      animate={{ scale: isFocused ? 1.01 : 1 }}
      transition={SPRING_SNAPPY}
      className={`relative squircle-md border-2 overflow-hidden transition-colors duration-150 ${
        error && !value && required ? 'border-error bg-error-container/20' :
        isFocused ? 'border-primary bg-primary/5' : 'border-outline/60 bg-surface-variant/50'
      }`}
    >
      <div className="flex items-center px-4 py-3.5">
        <Icon className={`w-5 h-5 mr-3 transition-colors duration-150 ${
          isFocused ? 'text-primary' : 'text-muted-foreground'
        }`} />
        <div className="flex-1 relative">
          <input
            type={type}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder=" "
            autoComplete={autoComplete}
            className="w-full bg-transparent text-foreground outline-none text-body-md pt-3 peer"
            required={required}
          />
          <label
            htmlFor={id}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-all duration-200 peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
          >
            {label}
          </label>
        </div>
        {rightElement}
      </div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isFocused ? 1 : 0 }}
        transition={SPRING_SNAPPY}
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary origin-left"
      />
    </motion.div>
  </div>
);

interface CustomLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'signup' | 'passkey-setup';

export function CustomLogin({ isOpen, onClose }: CustomLoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const controls = useAnimation();
  const formRef = useRef<HTMLFormElement>(null);
  const { refreshUser, user } = useAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setError('');
    setShowPassword(false);
    setFocusedField(null);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  // ==========================================
  // LOGIN (Custom Auth)
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authLogin(email, password);

      if (result.error) {
        setError(result.error);
        controls.start('shake');
      } else {
        await refreshUser();
        onClose();
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      controls.start('shake');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // SIGN UP (Custom Auth)
  // ==========================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const displayName = [firstName, lastName].filter(Boolean).join(' ') || null;
      const result = await authRegister(email, password, displayName || undefined);

      if (result.error) {
        setError(result.error);
        controls.start('shake');
      } else {
        await refreshUser();
        // Account created + logged in → offer passkey setup
        if (isWebAuthnSupported()) {
          setMode('passkey-setup');
        } else {
          onClose();
          resetForm();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
      controls.start('shake');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // GOOGLE OAUTH (Popup window with postMessage)
  // ==========================================
  const handleGoogleLogin = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('Google Client ID not configured.');
        controls.start('shake');
        setIsLoading(false);
        return;
      }

      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const state = crypto.randomUUID();
      localStorage.setItem('google_oauth_state', state);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'token id_token',
        scope: 'openid email profile',
        state,
        nonce: crypto.randomUUID(),
      });

      const popup = window.open(
        `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        'google-oauth',
        'width=500,height=600,left=200,top=100'
      );

      if (!popup) {
        setError('Popup blocked. Please allow popups for this site.');
        controls.start('shake');
        setIsLoading(false);
        return;
      }

      const onMessage = async (event: MessageEvent) => {
        console.log('[GoogleLogin] message received:', event.origin, event.data?.type);
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'google-auth-callback') return;
        window.removeEventListener('message', onMessage);

        try {
          const { user: googleUser } = event.data;
          if (!googleUser) throw new Error('No user data received.');

          // Cleanup state after use to prevent replay attacks
          localStorage.removeItem('google_oauth_state');

          const result = await oauthLogin(
            googleUser.email,
            googleUser.name || googleUser.email.split('@')[0],
            googleUser.picture || '',
            'google',
            googleUser.sub
          );



          if (result.error) {
            setError(result.error);
            controls.start('shake');
          } else {
            await refreshUser();
            onClose();
            resetForm();
          }
        } catch (err: any) {
          console.error('[GoogleLogin] OAuth flow error');
          setError('Google login failed');
          controls.start('shake');
        } finally {
          setIsLoading(false);
        }
      };

      window.addEventListener('message', onMessage);

      // Cleanup if popup closed without completing
      const pollClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollClosed);
          window.removeEventListener('message', onMessage);
          setIsLoading(false);
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      controls.start('shake');
      setIsLoading(false);
    }
  }, [controls, refreshUser, onClose]);

  // ==========================================
  // GITHUB OAUTH (Popup window)
  // ==========================================
  const handleGithubLogin = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (!clientId) {
        setError('GitHub Client ID not configured in .env');
        controls.start('shake');
        setIsLoading(false);
        return;
      }

      // Open GitHub OAuth popup
      const redirectUri = window.location.origin + '/auth/github/callback';
      const scope = 'read:user user:email';
      const state = crypto.randomUUID();
      localStorage.setItem('github_oauth_state', state);

      const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

      const popup = window.open(url, 'github-auth', 'width=500,height=700,left=100,top=100');

      // Listen for the callback message
      const handleMessage = async (event: MessageEvent) => {
        // SECURITY: Verify the message origin
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'github-auth-callback') {
          window.removeEventListener('message', handleMessage);
          popup?.close();

          const { email: ghEmail, name, avatar_url, id: providerId } = event.data.user;

          const result = await oauthLogin(
            ghEmail,
            name || ghEmail.split('@')[0],
            avatar_url || '',
            'github',
            String(providerId)
          );

          if (result.error) {
            setError(result.error);
            controls.start('shake');
          } else {
            await refreshUser();
            onClose();
            resetForm();
          }
          setIsLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        if (isLoading) setIsLoading(false);
      }, 120000);
    } catch (err: any) {
      setError(err.message || 'GitHub login failed');
      controls.start('shake');
      setIsLoading(false);
    }
  }, [controls, refreshUser, onClose, isLoading]);

  // ==========================================
  // SOCIAL LOGIN DISPATCHER
  // ==========================================
  const handleSocialLogin = (provider: 'google' | 'github') => {
    if (provider === 'google') handleGoogleLogin();
    else handleGithubLogin();
  };

  // ==========================================
  // BIOMETRIC / PASSKEY LOGIN (Custom Auth)
  // ==========================================
  const handleBiometricLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!isWebAuthnSupported()) {
        setError('Passkeys require a secure context (HTTPS) or localhost.');
        controls.start('shake');
        return;
      }

      const result = await authenticateWithPasskey();

      if (result.success && result.credential) {
        // Call the RPC function directly — no refresh tokens needed!
        const sessionToken = result.credential.supabaseRefreshToken; // repurposed field
        const loginResult = await passkeyLogin(
          result.credential.credentialId,
          sessionToken || ''
        );

        if (loginResult.error) {
          setError(loginResult.error);
          controls.start('shake');
        } else {
          await refreshUser();
          onClose();
          resetForm();
          return;
        }
      } else {
        setError(result.error || 'Passkey authentication failed.');
        controls.start('shake');
      }
    } catch (err: any) {
      console.error('Passkey error:', err);
      setError('Passkey authentication failed.');
      controls.start('shake');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // PASSKEY SETUP (After Sign Up)
  // ==========================================
  const handlePasskeySetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = getStoredToken();
      
      if (!token || !user) {
        throw new Error('No active session. Please log in first.');
      }

      const userEmail = user.email || email;
      const userName = user.display_name || email;
      
      const { registerPasskey } = await import('@/lib/webauthn');
      const result = await registerPasskey(user.id, userEmail, userName, token);
      
      if (result.success) {
        onClose();
        resetForm();
      } else {
        setError(result.error || 'Failed to register passkey.');
        controls.start('shake');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed.');
      controls.start('shake');
    } finally {
      setIsLoading(false);
    }
  };

  const skipPasskeySetup = () => {
    onClose();
    resetForm();
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const renderLoginForm = () => (
    <form ref={formRef} onSubmit={handleLogin} className="space-y-5">
      <FloatingInput
        id="login-email"
        type="email"
        value={email}
        onChange={setEmail}
        onFocus={() => setFocusedField('login-email')}
        onBlur={() => setFocusedField(null)}
        isFocused={focusedField === 'login-email'}
        error={error}
        label="Email address"
        icon={Mail}
        autoComplete="email"
      />

      <FloatingInput
        id="login-password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={setPassword}
        onFocus={() => setFocusedField('login-password')}
        onBlur={() => setFocusedField(null)}
        isFocused={focusedField === 'login-password'}
        error={error}
        label="Password"
        icon={Lock}
        autoComplete="current-password"
        rightElement={
          <IconButton
            type="button"
            variant="ghost"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground mr-1"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </IconButton>
        }
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={SPRING_DEFAULT}
            className="flex items-center gap-2 text-error text-body-sm p-3 bg-error-container/30 squircle-sm"
          >
            <div className="w-5 h-5 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">!</span>
            </div>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2"
        size="lg"
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
          />
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>
    </form>
  );

  const renderSignUpForm = () => (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="flex gap-3">
        <FloatingInput
          id="signup-first-name"
          value={firstName}
          onChange={setFirstName}
          onFocus={() => setFocusedField('signup-first-name')}
          onBlur={() => setFocusedField(null)}
          isFocused={focusedField === 'signup-first-name'}
          error={error}
          label="First name"
          icon={User}
          autoComplete="given-name"
          required={false}
        />
        <FloatingInput
          id="signup-last-name"
          value={lastName}
          onChange={setLastName}
          onFocus={() => setFocusedField('signup-last-name')}
          onBlur={() => setFocusedField(null)}
          isFocused={focusedField === 'signup-last-name'}
          error={error}
          label="Last name"
          icon={User}
          autoComplete="family-name"
          required={false}
        />
      </div>

      <FloatingInput
        id="signup-email"
        type="email"
        value={email}
        onChange={setEmail}
        onFocus={() => setFocusedField('signup-email')}
        onBlur={() => setFocusedField(null)}
        isFocused={focusedField === 'signup-email'}
        error={error}
        label="Email address"
        icon={Mail}
        autoComplete="email"
      />

      <FloatingInput
        id="signup-password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={setPassword}
        onFocus={() => setFocusedField('signup-password')}
        onBlur={() => setFocusedField(null)}
        isFocused={focusedField === 'signup-password'}
        error={error}
        label="Password"
        icon={Lock}
        autoComplete="new-password"
        rightElement={
          <IconButton
            type="button"
            variant="ghost"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground mr-1"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </IconButton>
        }
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={SPRING_DEFAULT}
            className="flex items-center gap-2 text-error text-body-sm p-3 bg-error-container/30 squircle-sm"
          >
            <div className="w-5 h-5 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">!</span>
            </div>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2"
        size="lg"
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
          />
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>
    </form>
  );

  const getHeaderText = () => {
    switch (mode) {
      case 'login': return { title: 'Welcome Back', subtitle: 'Sign in to continue your journey' };
      case 'signup': return { title: 'Create Account', subtitle: 'Join us and get started' };
      case 'passkey-setup': return { title: 'Enable Passkey', subtitle: 'Login securely without a password' };
    }
  };

  const header = getHeaderText();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-tertiary/15 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ x: [0, 60, 0], y: [0, 80, 0], scale: [1, 0.8, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/2 right-1/3 w-48 h-48 bg-secondary/20 rounded-full blur-3xl"
              />
            </div>
          </motion.div>

          {/* Bottom Sheet Login Panel */}
          <motion.div
            variants={bottomSheetContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg mx-0 sm:mx-4"
            style={{ maxHeight: '92vh' }}
          >
            <div className="relative rounded-t-[32px] sm:rounded-t-[36px] overflow-hidden overflow-y-auto" style={{ maxHeight: '92vh' }}>
              <div className="absolute inset-0 bg-surface/95 dark:bg-surface/95 backdrop-blur-[40px]" />

              <motion.div
                animate={controls}
                variants={shakeError}
                className="relative p-8 pb-10"
              >
                {/* Drag handle */}
                <div className="sheet-handle" />

                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={SPRING_SNAPPY}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={SPRING_BOUNCY}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container mb-4"
                  >
                    {mode === 'passkey-setup' ? (
                      <Fingerprint className="w-8 h-8 text-primary" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-primary" />
                    )}
                  </motion.div>
                  <h2 className="text-headline-md font-medium text-foreground mb-2">
                    {header.title}
                  </h2>
                  <p className="text-body-md text-muted-foreground">
                    {header.subtitle}
                  </p>
                </div>

                {/* Social Login — only in login/signup */}
                {(mode === 'login' || mode === 'signup') && (
                  <>
                    <div className="flex gap-3 mb-6">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING_BOUNCY}
                        onClick={() => handleSocialLogin('google')}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 squircle-md bg-surface-variant border border-outline/50 hover:border-primary/50 transition-colors"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-body-sm font-medium">Google</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING_BOUNCY}
                        onClick={() => handleSocialLogin('github')}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 squircle-md bg-surface-variant border border-outline/50 hover:border-primary/50 transition-colors"
                      >
                        <Github className="w-5 h-5" />
                        <span className="text-body-sm font-medium">GitHub</span>
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1 h-px bg-outline/50" />
                      <span className="text-label-sm text-muted-foreground">
                        or continue with email
                      </span>
                      <div className="flex-1 h-px bg-outline/50" />
                    </div>
                  </>
                )}

                {/* Forms */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
                    transition={SPRING_SNAPPY}
                  >
                    {mode === 'login' && renderLoginForm()}
                    {mode === 'signup' && renderSignUpForm()}
                    {mode === 'passkey-setup' && (
                      <div className="space-y-3">
                        {error && (
                          <motion.div
                            animate={{ opacity: 1 }}
                            className="mb-4 p-3 bg-error-container/30 text-error rounded-xl text-label-sm"
                          >
                            {error}
                          </motion.div>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={SPRING_BOUNCY}
                          onClick={handlePasskeySetup}
                          disabled={isLoading}
                          className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-50"
                        >
                          <Fingerprint className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          {isLoading ? 'Setting up...' : 'Setup Passkey Now'}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={SPRING_BOUNCY}
                          onClick={skipPasskeySetup}
                          disabled={isLoading}
                          className="w-full py-3.5 bg-surface-variant text-foreground font-semibold rounded-xl flex items-center justify-center disabled:opacity-50"
                        >
                          Skip for now
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Footer — toggle between login/signup */}
                {(mode === 'login' || mode === 'signup') && (
                  <div className="mt-6 text-center">
                    <p className="text-body-sm text-muted-foreground">
                      {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        transition={SPRING_SNAPPY}
                        onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-primary font-medium hover:underline"
                      >
                        {mode === 'login' ? 'Create one' : 'Sign in'}
                      </motion.button>
                    </p>
                  </div>
                )}

                {/* Biometric Option — only in login mode */}
                {mode === 'login' && (
                  <motion.button
                    type="button"
                    disabled={isLoading}
                    onClick={handleBiometricLogin}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING_BOUNCY}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 squircle-md border border-outline/50 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    <Fingerprint className="w-5 h-5 text-primary" />
                    <span className="text-body-sm font-medium">Use Passkey / Biometric</span>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
