
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Radio, ListMusic, Check, User, MessageSquare, AlertCircle, Timer, RotateCcw, Edit, PlayCircle, Info, Tag, Undo2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LiveDashboardPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLive, setIsLive] = useState(false);
  const [requestCap, setRequestCap] = useState(5);
  const [requests, setRequests] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFirstLiveModal, setShowFirstLiveModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [newSessionDuration, setNewSessionDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState('');
  const [allSongTags, setAllSongTags] = useState([]);
  const [activeSongTags, setActiveSongTags] = useState([]);
  const [undoVisible, setUndoVisible] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState(null);

  const canGoLive = profile?.url_slug && songs.length > 0;
  
  const fetchInitialData = useCallback(async () => {
    if (user) {
      setLoading(true);
      const { data: statusData } = await supabase.from('live_status').select('*').eq('user_id', user.id).maybeSingle();
      if (statusData) {
        setIsLive(statusData.is_live);
        setRequestCap(statusData.request_cap || 5);
        setActiveSongTags(statusData.active_song_tags || []);
        if (statusData.is_live && statusData.session_end_time) {
          setSessionEndTime(new Date(statusData.session_end_time));
        }
      } else {
        setRequestCap(5);
      }
      const { data: songsData } = await supabase.from('songs').select('id, tags').eq('user_id', user.id);
      setSongs(songsData || []);
      const uniqueTags = [...new Set(songsData.flatMap(s => s.tags || []))];
      setAllSongTags(uniqueTags);
      if (!statusData?.active_song_tags) {
        setActiveSongTags(uniqueTags);
      }
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  useEffect(() => {
    if (!user) return;
    const requestChannel = supabase.channel(`public:requests:artist_id=eq.${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, payload => {
        setRequests(currentRequests => {
            const sorted = (reqs) => reqs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            if (payload.eventType === 'INSERT') return sorted([...currentRequests, payload.new]);
            if (payload.eventType === 'UPDATE') return sorted(currentRequests.map(r => r.id === payload.new.id ? payload.new : r));
            if (payload.eventType === 'DELETE') return sorted(currentRequests.filter(r => r.id !== payload.old.id));
            return sorted(currentRequests);
        });
    }).subscribe();
    return () => supabase.removeChannel(requestChannel);
  }, [user]);
  
  useEffect(() => {
      if(isLive){
          const fetchInitialRequests = async () => {
              const { data } = await supabase.from('requests').select('*').eq('artist_id', user.id).order('created_at', { ascending: true });
              setRequests(data || []);
          };
          fetchInitialRequests();
      } else {
          setRequests([]);
      }
  }, [isLive, user]);


  useEffect(() => {
    if (!sessionEndTime || !isLive) { setTimeLeft(''); return; }
    const interval = setInterval(() => {
      const diff = new Date(sessionEndTime) - new Date();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        if (isLive) handleLiveToggle(false);
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionEndTime, isLive]);

  const updateLiveStatus = async (status) => {
    if (!user) return;
    await supabase.from('live_status').upsert({ user_id: user.id, ...status }, { onConflict: 'user_id' });
  };

  const handleLiveToggle = async (checked) => {
    if (checked && !canGoLive) { toast({ title: "Cannot Go Live", description: "Set URL & add songs first.", variant: "destructive" }); return; }
    
    if (undoTimeout) clearTimeout(undoTimeout);
    setUndoVisible(false);

    if (!checked) {
      setUndoVisible(true);
      const timeout = setTimeout(() => {
        setUndoVisible(false);
        setIsLive(false);
        setSessionEndTime(null);
        updateLiveStatus({ is_live: false, request_cap: requestCap, session_end_time: null, active_song_tags: allSongTags });
        toast({ title: "You are now Offline!", description: "Page back to normal." });
      }, 5000);
      setUndoTimeout(timeout);
      return;
    }

    const isFirstTime = !localStorage.getItem(`hasGoneLive_${user.id}`);
    if (checked && isFirstTime) { setShowFirstLiveModal(true); return; }
    
    setIsLive(true);
    const endTime = new Date(new Date().getTime() + 60 * 60 * 1000);
    setSessionEndTime(endTime);
    await updateLiveStatus({ is_live: true, request_cap: requestCap, session_end_time: endTime.toISOString(), active_song_tags: activeSongTags });
    toast({ title: `You are now Live!`, description: 'Accepting requests.' });
  };

  const cancelGoOffline = () => {
    if (undoTimeout) clearTimeout(undoTimeout);
    setUndoVisible(false);
    toast({ title: "Action Canceled", description: "You are still live." });
  };

  const startSessionFromModal = (minutes) => {
    localStorage.setItem(`hasGoneLive_${user.id}`, 'true');
    setShowFirstLiveModal(false);
    setIsLive(true);
    const endTime = new Date(new Date().getTime() + minutes * 60 * 1000);
    setSessionEndTime(endTime);
    updateLiveStatus({ is_live: true, request_cap: requestCap, session_end_time: endTime.toISOString(), active_song_tags: activeSongTags });
    toast({ title: "You are now Live!", description: "Accepting song requests." });
  };
  
  const handleUpdateTimer = () => {
    const endTime = new Date(new Date().getTime() + newSessionDuration * 60 * 1000);
    setSessionEndTime(endTime);
    updateLiveStatus({ session_end_time: endTime.toISOString() });
    setShowTimerModal(false);
    toast({ title: "Timer Updated!", description: `Session now ends in ${newSessionDuration} minutes.`});
  }

  const handleCapChange = (e) => {
    const cap = parseInt(e.target.value, 10) || 0;
    setRequestCap(cap);
    if (isLive) updateLiveStatus({ request_cap: cap });
  };
  
  const markAsPlayed = async (groupedRequest) => {
    const requestIds = groupedRequest.all_request_ids;
    const { error } = await supabase.from('requests').update({ status: 'played' }).in('id', requestIds);
    if(error){ toast({title: "Error", description: "Could not mark as played", variant: "destructive"}); return; }
    
    const transactions = requestIds.map(id => {
        const req = requests.find(r => r.id === id);
        const transaction = {
            artist_id: user.id, 
            request_id: id, 
            details: `${req.song_title} by ${req.requester_name}`, 
        };
        if (req.tip > 0) {
            return [
                {...transaction, type: 'Request', amount: req.amount_paid - req.tip},
                {...transaction, type: 'Tip', amount: req.tip}
            ];
        }
        return {...transaction, type: 'Request', amount: req.amount_paid};
    }).flat();

    await supabase.from('transactions').insert(transactions);
    toast({ title: "Request Marked as Played!", description: "Moved to completed requests." });
  };
  
  const enableRequestsForSong = async (songId) => {
    await supabase.from('requests').delete().match({ artist_id: user.id, song_id: songId, status: 'played' });
    toast({title: "Song Re-enabled", description: "Audience can now request this song again."});
  };

  const handleTagToggle = (tag) => {
    const newActiveTags = activeSongTags.includes(tag)
      ? activeSongTags.filter(t => t !== tag)
      : [...activeSongTags, tag];
    setActiveSongTags(newActiveTags);
    if (isLive) {
      updateLiveStatus({ active_song_tags: newActiveTags });
    }
  };

  const resetActiveTags = () => {
    setActiveSongTags(allSongTags);
    if (isLive) {
      updateLiveStatus({ active_song_tags: allSongTags });
    }
  };

  const groupedPendingRequests = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending' && !r.is_tip_only);
    const groups = pending.reduce((acc, req) => {
      acc[req.song_id] = acc[req.song_id] || { ...req, requesters: [], all_request_ids: [], total_paid: 0, total_tip: 0 };
      acc[req.song_id].requesters.push(req.requester_name);
      acc[req.song_id].all_request_ids.push(req.id);
      acc[req.song_id].total_paid += Number(req.amount_paid);
      acc[req.song_id].total_tip += Number(req.tip || 0);
      return acc;
    }, {});
    return Object.values(groups).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
  }, [requests]);

  const playedRequests = useMemo(() => {
    const played = requests.filter(r => r.status === 'played' && !r.is_tip_only);
    const groups = played.reduce((acc, req) => {
      acc[req.song_id] = acc[req.song_id] || { ...req, requesters: [] };
      acc[req.song_id].requesters.push(req.requester_name);
      return acc;
    }, {});
    return Object.values(groups).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }, [requests]);

  const tips = useMemo(() => requests.filter(r => r.is_tip_only), [requests]);
  
  const handleActionNav = (path, from) => {
    sessionStorage.setItem('onboarding_from', from);
    navigate(path);
  }

  return <>
      <Helmet><title>Live Dashboard - Your Song Request</title><meta name="description" content="Manage your live performance, song requests, and go live." /></Helmet>
      <TooltipProvider>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between py-4"><div className="flex items-center"><Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Link><span className="text-2xl font-bold neon-text">Live Dashboard</span></div></div></div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {!canGoLive && !loading && <Card className="glass-effect border-yellow-600 mb-8"><CardHeader><CardTitle className="flex items-center text-yellow-300"><AlertCircle className="mr-3" />Action Required</CardTitle><CardDescription className="text-yellow-400">Before you can go live, you need to complete your setup.</CardDescription></CardHeader><CardContent className="space-y-2">{!profile?.url_slug && <Button variant="link" className="p-0 h-auto text-blue-400 hover:underline" onClick={() => handleActionNav('/admin/profile', 'live-dashboard-url')}>1. Set your custom page URL in your profile.</Button>}{songs.length === 0 && <Button variant="link" className="p-0 h-auto text-blue-400 hover:underline block" onClick={() => handleActionNav('/admin/setlist', 'live-dashboard-songs')}>2. Add at least one song to your setlist.</Button>}</CardContent></Card>}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                
                <Card className="glass-effect border-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center"><ListMusic className="mr-3 text-purple-400" /> Incoming Requests</CardTitle>
                        <CardDescription>Real-time list of song requests from your audience.</CardDescription>
                      </div>
                      <div className="flex items-center space-x-4 text-right">
                          {isLive && timeLeft && (
                            <div className="flex items-center space-x-2 text-lg font-mono bg-gray-800/50 px-4 py-2 rounded-lg">
                              <Timer className="w-5 h-5 text-blue-400" />
                              <span>{timeLeft}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => setShowTimerModal(true)}>
                                <Edit className="w-4 h-4"/>
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                             <Label htmlFor="live-toggle" className={`text-lg font-semibold ${isLive ? 'text-red-400' : 'text-gray-400'}`}>{isLive ? 'LIVE' : 'OFFLINE'}</Label>
                             <Switch id="live-toggle" checked={isLive} onCheckedChange={handleLiveToggle} disabled={loading || !canGoLive || undoVisible} />
                          </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence>
                      {undoVisible && (
                        <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 flex items-center justify-between mb-4">
                          <p className="text-yellow-300">Going offline in 5s...</p>
                          <Button variant="ghost" onClick={cancelGoOffline}><Undo2 className="mr-2 h-4 w-4"/>Undo</Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {isLive && groupedPendingRequests.length > 0 ? <div className="space-y-4">{groupedPendingRequests.map((req, index) => <motion.div key={req.song_id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}><Card className="bg-gray-900/50 border-gray-700"><CardContent className="p-4"><div className="flex justify-between items-start"><div><h3 className="font-bold text-lg text-blue-300">{req.song_title}</h3><p className="text-sm text-gray-400 flex items-center mt-1"><User className="w-3 h-3 mr-2" />{req.requesters.join(', ')}</p>{req.note && <p className="text-sm text-gray-300 mt-2 italic flex items-start"><MessageSquare className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />{req.note}</p>}</div><div className="text-right flex-shrink-0 ml-4"><p className="font-bold text-lg text-green-400">£{(req.total_paid - req.total_tip).toFixed(2)} {req.total_tip > 0 && <span className="text-yellow-400 text-base font-semibold">+ £{req.total_tip.toFixed(2)} tip</span>}</p><Button size="sm" onClick={() => markAsPlayed(req)} className="mt-2 bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-2" />Mark as Played</Button></div></div></CardContent></Card></motion.div>)}</div> : <div className="text-center py-16"><Radio className={`w-16 h-16 mx-auto mb-4 ${isLive ? 'text-gray-500 animate-pulse' : 'text-gray-600'}`} /><h3 className="text-xl font-semibold">{isLive ? 'Waiting for requests...' : 'You are offline'}</h3><p className="text-gray-400">{isLive ? 'Requests from your audience will appear here.' : 'Toggle the switch above to start your session.'}</p>{!isLive && <Button onClick={() => handleLiveToggle(true)} disabled={loading || !canGoLive} className="mt-4 bg-blue-600 hover:bg-blue-700 neon-glow"><PlayCircle className="w-4 h-4 mr-2"/>GO LIVE</Button>}</div>}</CardContent></Card>
                <Card className="glass-effect border-gray-800 h-full"><CardHeader><CardTitle className="flex items-center text-gray-400"><Check className="mr-3" /> Played/Completed Requests</CardTitle></CardHeader><CardContent>{isLive && playedRequests.length > 0 ? <div className="space-y-4">{playedRequests.map((req, index) => <motion.div key={req.song_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.1 }}><Card className="bg-gray-900/50 border-gray-800 opacity-60"><CardContent className="p-4"><div className="flex justify-between items-center"><div><h3 className="font-semibold text-gray-400 line-through">{req.song_title}</h3><p className="text-sm text-gray-500">by {req.requesters.join(', ')}</p></div><Button size="sm" variant="ghost" onClick={() => enableRequestsForSong(req.song_id)} className="text-blue-400 hover:text-blue-300"><RotateCcw className="w-4 h-4 mr-2" />Enable</Button></div></CardContent></Card></motion.div>)}</div> : <p className="text-center text-gray-500 py-8">Played songs will appear here.</p>}</CardContent></Card>
              </div>
              <div className="space-y-8">
                <Card className="glass-effect border-gray-800"><CardHeader><CardTitle>Controls</CardTitle></CardHeader><CardContent className="space-y-4"><div><div className="flex items-center justify-between"><Label htmlFor="request-cap">Request Cap</Label><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500"><Info className="w-4 h-4"/></Button></TooltipTrigger><TooltipContent><p className="max-w-xs">Limit how many active requests can be in your Live Request Queue. Be mindful of how long you have in your set, and ensure all requests will be fulfilled.</p></TooltipContent></Tooltip></div><Input id="request-cap" type="number" value={requestCap} onChange={handleCapChange} className="bg-gray-900 border-gray-700" /></div><p className="text-sm text-gray-400">Requests in Queue: <span className="font-bold text-white">{groupedPendingRequests.length} / {requestCap > 0 ? requestCap : '∞'}</span></p></CardContent></Card>
                <Card className="glass-effect border-gray-800"><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center"><Tag className="mr-3 text-blue-400"/>Style/Genres</CardTitle><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500"><Info className="w-4 h-4"/></Button></TooltipTrigger><TooltipContent><p className="max-w-xs">As your Set progresses, you can make only a subset of songs appear for your audience on your Live Page. Allowing you to change the pacing/style of your set, whilst still allowing songs to be requested and fulfilled.</p></TooltipContent></Tooltip></div><CardDescription>Filter songs shown on your public page.</CardDescription></CardHeader><CardContent><div className="flex flex-wrap gap-2">{allSongTags.length > 0 ? allSongTags.map(tag => (<Button key={tag} variant={activeSongTags.includes(tag) ? 'default' : 'outline'} onClick={() => handleTagToggle(tag)} className="h-8">{tag}</Button>)) : <p className="text-sm text-gray-500">Add tags to songs in your setlist to enable filtering.</p>}</div>{allSongTags.length > 0 && <Button variant="link" size="sm" onClick={resetActiveTags} className="text-blue-400 hover:text-blue-300 mt-4 float-right">Reset/Deselect All</Button>}</CardContent></Card>
                <Card className="glass-effect border-gray-800"><CardHeader><CardTitle className="flex items-center text-yellow-400">Recent Tips</CardTitle></CardHeader><CardContent>{isLive && tips.length > 0 ? <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">{tips.map(tip => <div key={tip.id} className="flex justify-between items-center bg-gray-900/50 p-2 rounded-md"><p className="text-sm"><User className="w-3 h-3 mr-2 inline" />{tip.requester_name}</p><p className="font-semibold text-yellow-400">£{Number(tip.amount_paid).toFixed(2)}</p></div>)}</div> : <p className="text-sm text-gray-500 text-center py-4">{isLive ? 'No tips yet.' : 'Go live to receive tips.'}</p>}</CardContent></Card>
              </div>
            </div>
          </motion.div>
        </main>
        <Dialog open={showFirstLiveModal} onOpenChange={setShowFirstLiveModal}><DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
                <DialogTitle className="flex items-center"><Timer className="mr-2 text-blue-400"/>Set Session Duration</DialogTitle>
                <DialogDescription>By default, your Live Session will automatically go offline in 60 minutes. You can edit this timer at any time by clicking the pencil icon next to it.</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center"><p className="text-lg">Ready to start your session?</p></div>
            <DialogFooter><Button onClick={() => startSessionFromModal(60)} className="bg-blue-600 hover:bg-blue-700">Start 60 Minute Session</Button></DialogFooter>
        </DialogContent></Dialog>
        <Dialog open={showTimerModal} onOpenChange={setShowTimerModal}><DialogContent className="bg-gray-900 border-gray-700 text-white"><DialogHeader><DialogTitle className="flex items-center"><Edit className="mr-2 text-blue-400"/>Edit Session Duration</DialogTitle><DialogDescription>Extend or shorten your current live session.</DialogDescription></DialogHeader><div className="py-4 space-y-2"><Label htmlFor="duration">New Duration (minutes from now)</Label><Input id="duration" type="number" value={newSessionDuration} onChange={(e) => setNewSessionDuration(parseInt(e.target.value))} className="bg-gray-800 border-gray-600" /></div><DialogFooter><Button onClick={handleUpdateTimer} className="bg-blue-600 hover:bg-blue-700">Update Timer</Button></DialogFooter></DialogContent></Dialog>
      </div>
      </TooltipProvider>
    </>;
};
export default LiveDashboardPage;