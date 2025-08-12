import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Radio, ListMusic, Check, DollarSign, User, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const LiveDashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLive, setIsLive] = useState(false);
  const [requestCap, setRequestCap] = useState(15);
  const [requests, setRequests] = useState([]);
  
  const fetchLiveStatus = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase
        .from('live_status')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setIsLive(data.is_live);
        setRequestCap(data.request_cap);
      } else if(error && error.code === 'PGRST116') {
        // No status found, create one
        const { data: newData } = await supabase.from('live_status').insert({user_id: user.id, is_live: false, request_cap: 15 }).select().single();
        if(newData){
             setIsLive(newData.is_live);
             setRequestCap(newData.request_cap);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    fetchLiveStatus();
  }, [fetchLiveStatus]);

  useEffect(() => {
    if (!user) return;

    const requestChannel = supabase
      .channel(`public:requests:artist_id=eq.${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests', filter: `artist_id=eq.${user.id}` }, payload => {
          setRequests(currentRequests => {
              if (payload.eventType === 'INSERT') return [...currentRequests, payload.new];
              if (payload.eventType === 'DELETE') return currentRequests.filter(r => r.id !== payload.old.id);
              return currentRequests;
          });
      })
      .subscribe();

    const fetchInitialRequests = async () => {
        const { data } = await supabase.from('requests').select('*').eq('artist_id', user.id).eq('status', 'pending');
        setRequests(data || []);
    };
    fetchInitialRequests();

    return () => supabase.removeChannel(requestChannel);
  }, [user]);

  const updateLiveStatus = async (status) => {
    if (!user) return;
    const { error } = await supabase.from('live_status').update(status).eq('user_id', user.id);
    if(error) {
        toast({ title: "Error", description: "Could not update live status", variant: "destructive" });
    }
  };

  const handleLiveToggle = async (checked) => {
    setIsLive(checked);
    await updateLiveStatus({ is_live: checked, request_cap: requestCap });
    
    if (!checked) {
      // Clear requests when going offline
      const { error } = await supabase.from('requests').delete().eq('artist_id', user.id);
      if(!error) setRequests([]);
    }
    toast({
      title: `You are now ${checked ? 'Live' : 'Offline'}!`,
      description: checked ? 'Your public page is now accepting song requests.' : 'Your public page has returned to normal.'
    });
  };

  const handleCapChange = (e) => {
    const cap = parseInt(e.target.value, 10) || 0;
    setRequestCap(cap);
    updateLiveStatus({ request_cap: cap });
  };
  
  const markAsPlayed = async (request) => {
    // Add to transactions for payouts page
    await supabase.from('transactions').insert({
        artist_id: user.id,
        request_id: request.id,
        type: request.is_tip_only ? 'Tip' : 'Request',
        details: request.is_tip_only ? `From ${request.requester_name}` : `${request.song_title} by ${request.requester_name}`,
        amount: request.amount_paid
    });

    // Remove from requests queue
    await supabase.from('requests').delete().eq('id', request.id);

    toast({
      title: "Request Marked as Played!",
      description: "The request has been removed from the live queue."
    });
  };

  const pendingRequests = requests.filter(r => !r.is_tip_only);
  const tips = requests.filter(r => r.is_tip_only);

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="glass-effect border-gray-800 h-full">
                  <CardHeader><CardTitle className="flex items-center"><ListMusic className="mr-3 text-purple-400" /> Incoming Requests</CardTitle><CardDescription>Real-time list of song requests from your audience.</CardDescription></CardHeader>
                  <CardContent>
                    {isLive && pendingRequests.length > 0 ? <div className="space-y-4">{pendingRequests.map((req, index) => <motion.div key={req.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}><Card className="bg-gray-900/50 border-gray-700"><CardContent className="p-4"><div className="flex justify-between items-start"><div><h3 className="font-bold text-lg text-blue-300">{req.song_title}</h3><p className="text-sm text-gray-400 flex items-center mt-1"><User className="w-3 h-3 mr-2" />{req.requester_name}</p>{req.note && <p className="text-sm text-gray-300 mt-2 italic flex items-start"><MessageSquare className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />{req.note}</p>}</div><div className="text-right flex-shrink-0 ml-4"><p className="font-bold text-lg text-green-400 flex items-center justify-end"><DollarSign className="w-4 h-4" />{Number(req.amount_paid).toFixed(2)}</p><Button size="sm" onClick={() => markAsPlayed(req)} className="mt-2 bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-2" />Played</Button></div></div></CardContent></Card></motion.div>)}</div> : <div className="text-center py-16"><Radio className={`w-16 h-16 mx-auto mb-4 ${isLive ? 'text-gray-500 animate-pulse' : 'text-gray-600'}`} /><h3 className="text-xl font-semibold">{isLive ? 'Waiting for requests...' : 'You are offline'}</h3><p className="text-gray-400">{isLive ? 'Requests from your audience will appear here.' : 'Toggle the "Go Live" switch to start your session.'}</p></div>}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card className="glass-effect border-gray-800"><CardHeader><CardTitle>Controls</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="request-cap">Request Cap</Label><Input id="request-cap" type="number" value={requestCap} onChange={handleCapChange} className="bg-gray-900 border-gray-700" /><p className="text-xs text-gray-500 mt-1">Limit the amount of requests you can receive. Set to 0 for unlimited.</p></div><p className="text-sm text-gray-400">Requests: <span className="font-bold text-white">{pendingRequests.length} / {requestCap > 0 ? requestCap : '∞'}</span></p></CardContent></Card>
                <Card className="glass-effect border-gray-800"><CardHeader><CardTitle className="flex items-center"><DollarSign className="mr-3 text-yellow-400" /> Recent Tips</CardTitle></CardHeader><CardContent>{isLive && tips.length > 0 ? <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">{tips.map(tip => <div key={tip.id} className="flex justify-between items-center bg-gray-900/50 p-2 rounded-md"><p className="text-sm"><User className="w-3 h-3 mr-2 inline" />{tip.requester_name}</p><p className="font-semibold text-yellow-400">£{Number(tip.amount_paid).toFixed(2)}</p></div>)}</div> : <p className="text-sm text-gray-500 text-center py-4">{isLive ? 'No tips yet.' : 'Go live to receive tips.'}</p>}</CardContent></Card>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </>;
};
export default LiveDashboardPage;