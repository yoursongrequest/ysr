
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Music, Calendar, Gift, User, ChevronDown, ListMusic, MapPin, Users } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ArtistPage = () => {
  const { artistUrlSlug } = useParams();
  const { toast } = useToast();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [upcomingGigs, setUpcomingGigs] = useState([]);
  const [liveStatus, setLiveStatus] = useState({ is_live: false, request_cap: 0, active_song_tags: [] });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isTipDialogOpen, setIsTipDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ name: '', email: '', note: '', tip: '' });
  const [tipForm, setTipForm] = useState({ name: '', email: '', note: '', tip: '' });
  const [showAllRequests, setShowAllRequests] = useState(false);
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: artistData, error: artistError } = await supabase.from('profiles').select('*').eq('url_slug', artistUrlSlug).single();
      if (artistError || !artistData) { setLoading(false); return; }
      setArtist(artistData);
      
      const artistId = artistData.id;
      const { data: songsData } = await supabase.from('songs').select('*').eq('user_id', artistId).order('order');
      setSongs(songsData || []);

      const { data: gigsData } = await supabase.from('gigs').select('*, lat, lon, show_map').eq('user_id', artistId).gte('date', new Date().toISOString()).order('date');
      setUpcomingGigs(gigsData || []);

      const { data: statusData } = await supabase.from('live_status').select('*').eq('user_id', artistId).maybeSingle();
      setLiveStatus(statusData || { is_live: false, request_cap: 0, active_song_tags: [] });

      if (statusData && statusData.is_live) {
        const { data } = await supabase.from('requests').select('*').eq('artist_id', artistId).order('created_at', { ascending: true });
        setRequests(data || []);
      }

    } catch (error) { console.error('Error loading artist data:', error); } 
    finally { setLoading(false); }
  }, [artistUrlSlug]);
  
  useEffect(() => { loadData(); }, [loadData]);
  
  useEffect(() => {
    if (!artist?.id) return;
    const artistId = artist.id;

    const handleRealtimeUpdate = async () => {
      const { data } = await supabase.from('requests').select('*').eq('artist_id', artistId).order('created_at', { ascending: true });
      setRequests(data || []);
    };

    const requestChannel = supabase.channel(`public:requests:artist_id=eq.${artistId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, handleRealtimeUpdate).subscribe();
    
    const liveStatusChannel = supabase.channel(`public:live_status:user_id=eq.${artistId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'live_status' }, async (payload) => {
        const newStatus = payload.new || { is_live: false, request_cap: 0, active_song_tags: [] };
        setLiveStatus(newStatus);
        if(!newStatus.is_live) {
            setRequests([]);
        } else {
            await handleRealtimeUpdate();
        }
    }).subscribe();

    return () => { supabase.removeChannel(requestChannel); supabase.removeChannel(liveStatusChannel); };
  }, [artist]);

  const handleRequestClick = (song) => {
    setSelectedSong(song);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('requests').insert([{ artist_id: artist.id, song_id: selectedSong.id, song_title: selectedSong.title, requester_name: paymentForm.name, requester_email: paymentForm.email, note: paymentForm.note, amount_paid: selectedSong.price + (parseFloat(paymentForm.tip) || 0), tip: parseFloat(paymentForm.tip) || 0, status: 'pending' }]);
    if (error) { toast({ title: "Error", description: "Could not send request.", variant: "destructive" }); } 
    else { toast({ title: "Request Sent!", description: `Your request for "${selectedSong.title}" has been sent.` }); setIsPaymentDialogOpen(false); setPaymentForm({ name: '', email: '', note: '', tip: '' }); }
  };
  
  const handleTipSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('requests').insert([{ artist_id: artist.id, requester_name: tipForm.name, requester_email: tipForm.email, note: tipForm.note, amount_paid: parseFloat(tipForm.tip) || 0, tip: parseFloat(tipForm.tip) || 0, is_tip_only: true, status: 'pending' }]);
    if (error) { toast({ title: "Error", description: "Could not send tip.", variant: "destructive" }); } 
    else { toast({ title: "Tip Sent!", description: `Thank you for your generous tip!` }); setIsTipDialogOpen(false); setTipForm({ name: '', email: '', note: '', tip: '' }); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });

  const playedSongIds = useMemo(() => new Set(requests.filter(r => r.status === 'played').map(r => r.song_id)), [requests]);

  const groupedRequests = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending' && !r.is_tip_only);
    const groups = pending.reduce((acc, req) => {
      acc[req.song_id] = acc[req.song_id] || { ...req, count: 0, requesters: [] };
      acc[req.song_id].count += 1;
      acc[req.song_id].requesters.push(req.requester_name);
      return acc;
    }, {});
    return Object.values(groups).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
  }, [requests]);

  const filteredSongs = useMemo(() => {
    if (!liveStatus.is_live || !liveStatus.active_song_tags || liveStatus.active_song_tags.length === 0) {
      return songs;
    }
    return songs.filter(song => song.tags && song.tags.some(tag => liveStatus.active_song_tags.includes(tag)));
  }, [songs, liveStatus]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;
  if (!artist) return <div className="min-h-screen bg-black flex items-center justify-center px-4"><Card className="glass-effect border-gray-800 text-center max-w-md"><CardContent className="p-8"><User className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h2 className="text-2xl font-bold text-white mb-2">Artist Not Found</h2><p className="text-gray-400 mb-6">The artist you're looking for doesn't exist.</p><Link to="/"><Button className="bg-blue-600 hover:bg-blue-700 text-white"><Music className="w-4 h-4 mr-2" />Your Song Request</Button></Link></CardContent></Card></div>;

  const pendingSongRequestsCount = requests.filter(r => r.status === 'pending' && !r.is_tip_only).length;
  const requestsReachedCap = liveStatus.request_cap > 0 && pendingSongRequestsCount >= liveStatus.request_cap;
  const displayedRequests = showAllRequests ? groupedRequests : groupedRequests.slice(0, 2);

  return (
    <>
      <Helmet><title>{artist.artist_name} - Your Song Request</title><meta name="description" content={`Request songs from ${artist.artist_name}. ${artist.bio || ''}`} /></Helmet>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
            <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-bold"><Music className="w-5 h-5 mr-2"/>Your Song Request</Link>
            {liveStatus.is_live && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2"><div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></div><span className="text-red-400 font-bold">LIVE</span></motion.div>}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="glass-effect border-gray-800 mb-8"><CardContent className="p-8 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left"><div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">{artist.profile_picture_url ? <img src={artist.profile_picture_url} alt={artist.artist_name} className="w-24 h-24 rounded-full object-cover" /> : artist.artist_name.charAt(0).toUpperCase()}</div><div className="flex-1"><h1 className="text-4xl font-bold text-white mb-2 neon-text">{artist.artist_name}</h1>{artist.bio && <p className="text-gray-300 text-lg leading-relaxed">{artist.bio}</p>}</div></CardContent></Card>

            {liveStatus.is_live ? (
              <TooltipProvider>
              <div>
                {requestsReachedCap && <Card className="bg-yellow-900/50 border-yellow-600 text-center py-4 mb-6"><CardContent className="p-2"><p className="font-semibold text-yellow-300">The artist is not taking any more requests right now, but you can still send a tip!</p></CardContent></Card>}
                
                <Card className="glass-effect border-gray-800 mb-8">
                    <CardHeader><CardTitle className="flex items-center"><ListMusic className="mr-3 text-purple-400"/>Live Request Queue</CardTitle></CardHeader>
                    <CardContent>
                        {groupedRequests.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">There's nothing here yet, be the first to request a song!</p>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <AnimatePresence>
                                        {displayedRequests.map((req) => (
                                            <motion.div key={req.song_id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-between items-center text-sm text-gray-300 pl-2 border-l-2 border-gray-700">
                                                <span>"{req.song_title}"</span>
                                                {req.count > 0 && 
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="flex items-center text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full cursor-pointer">
                                                                <Users className="w-3 h-3 mr-1" />{req.count}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">{req.count} people have requested this. Show your support to {artist.artist_name} and request this song too!</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                }
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                {groupedRequests.length > 2 && <Button variant="ghost" size="sm" onClick={() => setShowAllRequests(!showAllRequests)} className="mt-2 text-blue-400 hover:text-blue-300">{showAllRequests ? 'Show Less' : `Show ${groupedRequests.length - 2} more`}<ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAllRequests ? 'rotate-180' : ''}`} /></Button>}
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-white mb-6">Request a Song</h2>
                    {filteredSongs.length === 0 ? <Card className="glass-effect border-gray-800 text-center py-12"><CardContent><Music className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">No songs available</h3><p className="text-gray-400">This artist hasn't added any songs to their setlist yet, or no songs match the current filter.</p></CardContent></Card> : <div className="grid gap-4">{filteredSongs.map((song, i) => { const isPlayed = playedSongIds.has(song.id); return (<motion.div key={song.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}><Card className={`glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300 ${isPlayed ? 'opacity-50' : ''}`}><CardContent className="p-6 flex items-center justify-between"><div className="flex-1"><h3 className="text-lg font-semibold text-white mb-1">{song.title}</h3><p className="text-gray-400 mb-3">by {song.original_artist}</p><div className="flex items-center text-green-400 font-semibold">£{Number(song.price).toFixed(2)}</div></div><Button onClick={() => handleRequestClick(song)} disabled={requestsReachedCap || isPlayed} className="bg-blue-600 hover:bg-blue-700 text-white neon-glow disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{isPlayed ? 'Played' : 'Request'}</Button></CardContent></Card></motion.div>);})}</div>}
                  </div>
                  <div><h2 className="text-2xl font-bold text-white mb-6">Send a Tip</h2><Card className="glass-effect border-gray-800"><CardContent className="p-6 text-center"><Gift className="w-12 h-12 text-yellow-400 mx-auto mb-4" /><p className="text-gray-300 mb-4">Enjoying the show? Show your appreciation!</p><Button onClick={() => setIsTipDialogOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold w-full">Send a Tip</Button></CardContent></Card></div>
                </div>
              </div>
              </TooltipProvider>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Upcoming Shows</h2>
                {upcomingGigs.length === 0 ? <Card className="glass-effect border-gray-800 text-center py-12"><CardContent><Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">No upcoming shows</h3><p className="text-gray-400">Check back later for new performances!</p></CardContent></Card> : <div className="space-y-4">{upcomingGigs.map((gig, i) => (<motion.div key={gig.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}><Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300"><CardContent className="p-6 flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4"><div className="text-center w-full sm:w-20 flex-shrink-0"><p className="text-3xl font-bold">{new Date(gig.date).toLocaleDateString('en-GB', { day: '2-digit' })}</p><p className="text-sm uppercase text-gray-400">{new Date(gig.date).toLocaleString('en-GB', { month: 'short' })}</p></div><div className="border-t sm:border-t-0 sm:border-l border-gray-700 pt-4 sm:pt-0 sm:pl-4 flex-1"><h3 className="font-bold text-lg">{gig.venue_name}</h3><p className="text-gray-400">{formatDate(gig.date)} at {new Date('1970-01-01T' + gig.time + 'Z').toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', hour12: false})}</p>{gig.address && <p className="text-gray-400 mt-2 flex items-start"><MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />{gig.address}</p>}</div></CardContent>{gig.show_map && gig.lat && gig.lon && <div className="w-full h-48 bg-gray-800"><iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://www.openstreetmap.org/export/embed.html?bbox=${gig.lon-0.01},${gig.lat-0.01},${gig.lon+0.01},${gig.lat+0.01}&layer=mapnik&marker=${gig.lat},${gig.lon}`} title={`Map for ${gig.venue_name}`} className="grayscale invert hue-rotate-180"></iframe></div>}</Card></motion.div>))}</div>}
              </div>
            )}
          </motion.div>
        </main>
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}><DialogContent className="bg-gray-900 border-gray-700 text-white"><DialogHeader><DialogTitle>Request "{selectedSong?.title}"</DialogTitle><DialogDescription>Fill out the form below to send your request.</DialogDescription></DialogHeader><form onSubmit={handlePaymentSubmit} className="space-y-4"><div><Label htmlFor="name">Your Name</Label><Input id="name" value={paymentForm.name} onChange={(e) => setPaymentForm({...paymentForm, name: e.target.value})} required className="bg-gray-800 border-gray-600" /></div><div><Label htmlFor="email">Your Email (optional - for receipt)</Label><Input id="email" type="email" value={paymentForm.email} onChange={(e) => setPaymentForm({...paymentForm, email: e.target.value})} className="bg-gray-800 border-gray-600" /></div><div><Label htmlFor="note">Note for Artist (optional)</Label><Textarea id="note" value={paymentForm.note} onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})} className="bg-gray-800 border-gray-600" /></div><div><Label htmlFor="tip">Add a Tip (optional)</Label><Input id="tip" type="number" step="0.01" min="0" value={paymentForm.tip} onChange={(e) => setPaymentForm({...paymentForm, tip: e.target.value})} placeholder="e.g., 5.00" className="bg-gray-800 border-gray-600" /></div><DialogFooter><p className="mr-auto text-lg font-bold">Total: £{(Number(selectedSong?.price) + (parseFloat(paymentForm.tip) || 0)).toFixed(2)}</p><Button type="submit" className="bg-blue-600 hover:bg-blue-700">Submit Request</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={isTipDialogOpen} onOpenChange={setIsTipDialogOpen}><DialogContent className="bg-gray-900 border-gray-700 text-white"><DialogHeader><DialogTitle>Send a Tip</DialogTitle><DialogDescription>Show your appreciation for {artist.artist_name}.</DialogDescription></DialogHeader><form onSubmit={handleTipSubmit} className="space-y-4"><div><Label htmlFor="tip-amount">Tip Amount (£)</Label><Input id="tip-amount" type="number" step="0.01" min="0" value={tipForm.tip} onChange={(e) => setTipForm({...tipForm, tip: e.target.value})} required placeholder="e.g., 10.00" className="bg-gray-800 border-gray-600" /></div><div><Label htmlFor="tip-name">Your Name</Label><Input id="tip-name" value={tipForm.name} onChange={(e) => setTipForm({...tipForm, name: e.target.value})} required className="bg-gray-800 border-gray-600" /></div><div><Label htmlFor="tip-email">Your Email (optional - for receipt)</Label><Input id="tip-email" type="email" value={tipForm.email} onChange={(e) => setTipForm({...tipForm, email: e.target.value})} className="bg-gray-800 border-gray-600" /></div><div><Label htmlFor="tip-note">Note for Artist (optional)</Label><Textarea id="tip-note" value={tipForm.note} onChange={(e) => setTipForm({...tipForm, note: e.target.value})} className="bg-gray-800 border-gray-600" /></div><DialogFooter><Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Send Tip</Button></DialogFooter></form></DialogContent></Dialog>
      </div>
    </>
  );
};

export default ArtistPage;