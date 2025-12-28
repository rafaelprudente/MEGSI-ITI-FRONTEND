import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, CheckCircle } from 'lucide-react'
import { authService } from '../lib/auth'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hash = searchParams.get('hash')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!hash) {
      setError('Invalid or missing change password link')
    }
  }, [hash])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!hash) {
      setError('Invalid change password link')
      return
    }

    setLoading(true)

    try {
      await authService.changePassword(password, hash)
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      console.error('Change password failed:', err)
      let errorMessage = 'Failed to change password. Try again.'
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail
        }
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Set Your Password</h1>
          <p className="text-gray-600">Complete your UM Drive registration</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">Password Set Successfully!</h2>
              <p className="text-gray-600">
                Your account is now active. Redirecting to login...
              </p>
            </div>
            <Link
              to="/login"
              className="btn btn-primary inline-block"
            >
              Go to Login Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Create a strong password"
                required
                minLength={8}
                disabled={!hash}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Repeat your password"
                required
                minLength={8}
                disabled={!hash}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !hash}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              <Lock className="w-4 h-4 mr-2" />
              {loading ? 'Setting password...' : 'Set Password'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="text-primary-600 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
