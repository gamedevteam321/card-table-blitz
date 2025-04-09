import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if we have a valid access token in the URL
    const accessToken = searchParams.get('access_token');
    if (!accessToken) {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-casino-dark flex flex-col items-center justify-center p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-casino-dark border border-[#00a92d]/30 rounded-[10px] p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Reset Password</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-[10px] mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-[10px] mb-4 text-sm">
              Password reset successfully! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-[10px] bg-casino-dark/50 border border-[#00a92d]/30 text-white placeholder-white/50 focus:outline-none focus:border-[#00a92d] focus:ring-1 focus:ring-[#00a92d]"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-[10px] bg-casino-dark/50 border border-[#00a92d]/30 text-white placeholder-white/50 focus:outline-none focus:border-[#00a92d] focus:ring-1 focus:ring-[#00a92d]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full px-8 py-3 bg-[#00a92d] hover:bg-[#00a92d]/90 text-white font-bold rounded-[10px] text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword; 