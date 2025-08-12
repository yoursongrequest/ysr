import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { User, Music, Calendar, LogOut, ExternalLink, Radio, Banknote } from 'lucide-react';

const AdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const dashboardCards = [
    {
      title: "Live Dashboard",
      description: "Manage your live performance and song requests",
      icon: Radio,
      link: "/admin/live",
      color: "from-red-500 to-orange-500"
    },
    {
      title: "Profile Management",
      description: "Update your artist name, bio, and profile picture",
      icon: User,
      link: "/admin/profile",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Setlist Management",
      description: "Manage your song catalog with custom pricing",
      icon: Music,
      link: "/admin/setlist",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Calendar Management",
      description: "Schedule and manage your upcoming performances",
      icon: Calendar,
      link: "/admin/calendar",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Payouts",
      description: "View your earnings and request payouts",
      icon: Banknote,
      link: "/admin/payouts",
      color: "from-yellow-500 to-lime-500"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Artist Dashboard - Your Song Request</title>
        <meta name="description" content="Manage your artist profile, setlist, and upcoming performances from your dashboard." />
        <meta property="og:title" content="Artist Dashboard - Your Song Request" />
        <meta property="og:description" content="Manage your artist profile, setlist, and upcoming performances from your dashboard." />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link to="/" className="text-2xl font-bold neon-text">YSR</Link>
                <span className="text-gray-400">|</span>
                <span className="text-gray-300">Dashboard</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400 hidden sm:block">Welcome, {profile?.artist_name || user?.email}</span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Artist Dashboard</h1>
              <p className="text-gray-400">Manage your profile, setlist, and performances</p>
            </div>

            {/* Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardCards.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300 group h-full flex flex-col">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-white">{card.title}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {card.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <Link to={card.link}>
                        <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white">
                          Manage
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
               <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: dashboardCards.length * 0.1 }}
                >
                  <Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300 group h-full flex flex-col">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-white">View Public Page</CardTitle>
                      <CardDescription className="text-gray-400">
                        See what your audience sees on your public page.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <Link to={`/artist/${user?.id}`} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white">
                          View Page
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;