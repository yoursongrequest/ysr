import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ArrowLeft, Music } from 'lucide-react';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [artistName, setArtistName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, {
        data: {
            artistName: artistName
        }
    });
    if (!error) {
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Artist Signup - Your Song Request</title>
        <meta name="description" content="Create your artist account and start managing song requests from your audience during live performances." />
        <meta property="og:title" content="Artist Signup - Your Song Request" />
        <meta property="og:description" content="Create your artist account and start managing song requests from your audience during live performances." />
      </Helmet>

      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-cyan-900/10"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <Card className="glass-effect border-gray-800">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Music className="w-12 h-12 text-blue-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Create Artist Account</CardTitle>
              <CardDescription className="text-gray-400">
                Join the platform and start receiving song requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="artistName" className="text-white">Artist Name</Label>
                  <Input
                    id="artistName"
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="Your stage name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 neon-glow"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                    Login here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default SignupPage;