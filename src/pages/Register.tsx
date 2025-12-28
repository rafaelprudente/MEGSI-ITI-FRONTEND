import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Mail, CheckCircle } from 'lucide-react'
import { authService } from '../lib/auth'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    setLoading(true)

    try {
      await authService.register({ name, email })
      setSuccess(true)
      // Don't navigate, show success message instead
    } catch (err: any) {
      console.error('Registration failed:', err)
      let errorMessage = 'Registration failed. Try again.'
      
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
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Create Account</h1>
          <p className="text-gray-600">Join UM Drive today</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">Registration Successful!</h2>
              <div className="flex items-start justify-center text-gray-600">
                <Mail className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-left">
                  We've sent an email to <strong>{email}</strong> with instructions to set your password.
                  Please check your inbox and follow the link to complete your registration.
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="btn btn-primary inline-block"
            >
              Go to Login
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <Mail className="w-4 h-4 inline mr-1" />
                You'll receive an email to set your password after registration.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Creating account...' : 'Register'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
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
