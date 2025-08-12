import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Radio, ListMusic, Check, DollarSign, User, MessageSquare } from 'lucide-react';
const LiveDashboardPage = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isLive, setIsLive] = useState(false);
  const [requestCap, setRequestCap] = useState(15);
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    if (user) {
      const savedStatus = JSON.parse(localStorage.getItem(`ysr_live_status_${user.id}`) || '{}');
      setIsLive(savedStatus.isLive || false);
      setRequestCap(savedStatus.requestCap || 15);
      const loadRequests = () => {
        const savedRequests = JSON.parse(localStorage.getItem(`ysr_requests_${user.id}`) || '[]');
        setRequests(savedRequests);
      };
      loadRequests();
      const interval = setInterval(loadRequests, 2000); // Poll for new requests every 2 seconds
      return () => clearInterval(interval);
    }
  }, [user]);
  const handleLiveToggle = checked => {
    setIsLive(checked);
    const status = {
      isLive: checked,
      requestCap
    };
    localStorage.setItem(`ysr_live_status_${user.id}`, JSON.stringify(status));
    if (!checked) {
      // Clear requests when going offline
      localStorage.removeItem(`ysr_requests_${user.id}`);
      setRequests([]);
    }
    toast({
      title: `You are now ${checked ? 'Live' : 'Offline'}!`,
      description: checked ? 'Your public page is now accepting song requests.' : 'Your public page has returned to normal.'
    });
  };
  const handleCapChange = e => {
    const cap = parseInt(e.target.value, 10);
    setRequestCap(cap);
    const status = {
      isLive,
      requestCap: cap
    };
    localStorage.setItem(`ysr_live_status_${user.id}`, JSON.stringify(status));
  };
  const markAsPlayed = requestId => {
    const updatedRequests = requests.filter(req => req.id !== requestId);
    setRequests(updatedRequests);
    localStorage.setItem(`ysr_requests_${user.id}`, JSON.stringify(updatedRequests));

    // Add to transactions for payouts page
    const playedRequest = requests.find(req => req.id === requestId);
    if (playedRequest) {
      const transactions = JSON.parse(localStorage.getItem(`ysr_transactions_${user.id}`) || '[]');
      transactions.push(playedRequest);
      localStorage.setItem(`ysr_transactions_${user.id}`, JSON.stringify(transactions));
    }
    toast({
      title: "Request Marked as Played!",
      description: "The request has been removed from the live queue."
    });
  };
  const pendingRequests = requests.filter(r => r.status === 'pending' && !r.isTipOnly);
  const tips = requests.filter(r => r.isTipOnly);
  return <>
      <Helmet>
        <title>Live Dashboard - Your Song Request</title>
        <meta name="description" content="Manage your live performance, song requests, and go live." />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <span className="text-2xl font-bold neon-text">Live Dashboard</span>
              </div>
              <div className="flex items-center space-x-4">
                <Label htmlFor="live-toggle" className={`font-semibold ${isLive ? 'text-red-400' : 'text-gray-400'}`}>
                  {isLive ? 'LIVE' : 'OFFLINE'}
                </Label>
                <Switch id="live-toggle" checked={isLive} onCheckedChange={handleLiveToggle} />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Request Queue */}
              <div className="lg:col-span-2">
                <Card className="glass-effect border-gray-800 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center"><ListMusic className="mr-3 text-purple-400" /> Incoming Requests</CardTitle>
                    <CardDescription>Real-time list of song requests from your audience.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLive && pendingRequests.length > 0 ? <div className="space-y-4">
                        {pendingRequests.map((req, index) => <motion.div key={req.id} initial={{
                      opacity: 0,
                      scale: 0.9
                    }} animate={{
                      opacity: 1,
                      scale: 1
                    }} transition={{
                      delay: index * 0.1
                    }}>
                            <Card className="bg-gray-900/50 border-gray-700">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-bold text-lg text-blue-300">{req.songTitle}</h3>
                                    <p className="text-sm text-gray-400 flex items-center mt-1"><User className="w-3 h-3 mr-2" />{req.requesterName}</p>
                                    {req.note && <p className="text-sm text-gray-300 mt-2 italic flex items-start"><MessageSquare className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />{req.note}</p>}
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-4">
                                    <p className="font-bold text-lg text-green-400 flex items-center justify-end"><DollarSign className="w-4 h-4" />{req.amountPaid.toFixed(2)}</p>
                                    <Button size="sm" onClick={() => markAsPlayed(req.id)} className="mt-2 bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-2" />Played</Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>)}
                      </div> : <div className="text-center py-16">
                        <Radio className={`w-16 h-16 mx-auto mb-4 ${isLive ? 'text-gray-500 animate-pulse' : 'text-gray-600'}`} />
                        <h3 className="text-xl font-semibold">{isLive ? 'Waiting for requests...' : 'You are offline'}</h3>
                        <p className="text-gray-400">{isLive ? 'Requests from your audience will appear here.' : 'Toggle the "Go Live" switch to start your session.'}</p>
                      </div>}
                  </CardContent>
                </Card>
              </div>

              {/* Controls & Tips */}
              <div className="space-y-8">
                <Card className="glass-effect border-gray-800">
                  <CardHeader>
                    <CardTitle>Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="request-cap">Request Cap</Label>
                      <Input id="request-cap" type="number" value={requestCap} onChange={handleCapChange} className="bg-gray-900 border-gray-700" />
                      <p className="text-xs text-gray-500 mt-1">Limit the amount of requests you can receive and queue at any one time. Set to 0 for unlimited requests. [Ensure that requests can be fulfilled when selecting this number].</p>
                    </div>
                    <p className="text-sm text-gray-400">Requests: <span className="font-bold text-white">{pendingRequests.length} / {requestCap > 0 ? requestCap : '∞'}</span></p>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center"><DollarSign className="mr-3 text-yellow-400" /> Recent Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLive && tips.length > 0 ? <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
                        {tips.map(tip => <div key={tip.id} className="flex justify-between items-center bg-gray-900/50 p-2 rounded-md">
                            <p className="text-sm"><User className="w-3 h-3 mr-2 inline" />{tip.requesterName}</p>
                            <p className="font-semibold text-yellow-400">£{tip.amountPaid.toFixed(2)}</p>
                          </div>)}
                      </div> : <p className="text-sm text-gray-500 text-center py-4">{isLive ? 'No tips yet.' : 'Go live to receive tips.'}</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </>;
};
export default LiveDashboardPage;