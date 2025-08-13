
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Music, Calendar, MapPin, Radio, User, Send, DollarSign, Heart, Info, Clock } from 'lucide-react';

const SocialIcon = ({ platform, handle }) => {
  const socialLinks = {
    facebook: `https://facebook.com/${handle}`,
    x: `https://x.com/${handle}`,
    instagram: `https://instagram.com/${handle}`,
    tiktok: `https://tiktok.com/@${handle}`,
  };

  const platformIcons = {
    facebook: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04c-5.5 0-10 4.49-10 10s4.5 10 10 10 10-4.49 10-10-4.5-10-10-10zm2.28 7.32h-1.67c-.43 0-.68.22-.68.74v1.1h2.33l-.38 2.33h-1.95v7.12h-2.53v-7.12h-1.67v-2.33h1.67v-.92c0-1.39.81-2.83 2.83-2.83h1.8v2.33z"></path></svg>
    ),
    x: (
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.602.75Zm-1.28,12.95h1.98L4.05 2.16H1.98l9.34 11.54Z"/></svg>
    ),
    instagram: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.2,5.2 0,0 1,16.2 22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.2,5.2 0,0 1,7.8 2M7.6,4A3.6,3.6 0,0 0,4 7.6V16.4A3.6,3.6 0,0 0,7.6 20H16.4A3.6,3.6 0,0 0,20 16.4V7.6A3.6,3.6 0,0 0,16.4 4H7.6M17.2,6A1.2,1.2 0,0 1,16 7.2A1.2,1.2 0,0 1,14.8 6A1.2,1.2 0,0 1,16 4.8A1.2,1.2 0,0 1,17.2 6M12,7A5,5 0,0 1,17 12A5,5 0,0 1,12 17A5,5 0,0 1,7 12A5,5 0,0 1,12 7M12,9A3,3 0,0 0,9 12A3,3 0,0 0,12 15A3,3 0,0 0,15 12A3,3 0,0 0,12 9Z"></path></svg>
    ),
    tiktok: (
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0c-1.4 1.4-1.4 1.4-1.4 1.4s-.51-.5 0 0c.51.5.51.5.51.5V3.7s0-1.19.51-1.19c.51 0 .51.5.51.5s0 .51 0 0v2.81zm-2.48 2.48c-1.4-1.4-1.4-1.4-1.4-1.4s-.51-.5 0 0c1.4 1.4 1.4 1.4 1.4 1.4s.51.5 0 0zm-2.48 2.48c-1.4-1.4-1.4-1.4-1.4-1.4s-.51-.5 0 0c1.4 1.4 1.4 1.4 1.4 1.4s.51.5 0 0zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.19 12.37c-.03.52-.22 1-.58 1.39-.36.38-.8.61-1.32.61s-.96-.23-1.32-.61c-.36-.39-.55-.87-.58-1.39-.03-.52-.03-1.04 0-1.56.03-.52.22-1 .58-1.39.36-.38.8-.61 1.32-.61s.96.23 1.32.61c.36.39.55.87.58 1.39.03.52.03 1.04 0 1.56z"></path></svg>
    ),
  };

  return (
    <a href={socialLinks[platform]} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
      {platformIcons[platform]}
    </a>
  );
};


const ArtistPage = () => {
    const { artistUrlSlug } = useParams();
    const { toast } = useToast();

    const [artist, setArtist] = useState(null);
    const [songs, setSongs] = useState([]);
    const [liveStatus, setLiveStatus] = useState(null);
    const [gigs, setGigs] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');

    const fetchData = useCallback(async () => {
        // No need to set loading true here, handled in initial load
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('url_slug', artistUrlSlug)
            .single();

        if (profileError || !profileData) {
            setError("Artist not found. Are you sure the URL is correct?");
            setLoading(false);
            return;
        }
        setArtist(profileData);

        const { data: songsData } = await supabase.from('songs').select('*').eq('user_id', profileData.id).order('order');
        setSongs(songsData || []);
        
        const { data: gigsData } = await supabase.from('gigs').select('*').eq('user_id', profileData.id).order('date', { ascending: false });
        setGigs(gigsData || []);

        const { data: liveStatusData } = await supabase.from('live_status').select('*').eq('user_id', profileData.id).single();
        setLiveStatus(liveStatusData);
        
        if (liveStatusData?.is_live) {
            const { data: requestsData } = await supabase.from('requests').select('*').eq('artist_id', profileData.id).order('created_at', { ascending: true });
            setRequests(requestsData || []);
        } else {
            // For offline view, still fetch played songs to disable them
            const { data: playedRequestsData } = await supabase
                .from('requests')
                .select('song_id')
                .eq('artist_id', profileData.id)
                .eq('status', 'played');
            setRequests(playedRequestsData || []);
        }

        setLoading(false);
    }, [artistUrlSlug]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!artist) return;

        const liveStatusChannel = supabase.channel(`public:live_status:user_id=eq.${artist.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_status' }, payload => {
                const newStatus = payload.new;
                setLiveStatus(newStatus);
                if (newStatus.is_live) {
                    fetchData(); // Refetch everything when going live
                } else {
                    setRequests([]);
                }
            }).subscribe();

        const requestsChannel = supabase.channel(`public:requests:artist_id=eq.${artist.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests'}, () => {
                if (liveStatus?.is_live) {
                    fetchData();
                }
            }).subscribe();
        
        return () => {
            supabase.removeChannel(liveStatusChannel);
            supabase.removeChannel(requestsChannel);
        };
    }, [artist, liveStatus, fetchData]);
    
     useEffect(() => {
        if (!liveStatus?.session_end_time || !liveStatus?.is_live) {
            setTimeLeft('');
            return;
        }
        const interval = setInterval(() => {
            const diff = new Date(liveStatus.session_end_time) - new Date();
            if (diff <= 0) {
                setTimeLeft('Offline');
                clearInterval(interval);
                return;
            }
            const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            setTimeLeft(`${h}:${m}:${s}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [liveStatus]);

    const liveRequests = useMemo(() => {
        const pending = requests.filter(r => r.status === 'pending');
        const groups = pending.reduce((acc, req) => {
            if (req.is_tip_only) return acc;
            acc[req.song_id] = acc[req.song_id] || { ...req, requesters: [], requester_count: 0 };
            acc[req.song_id].requester_count++;
            return acc;
        }, {});
        return Object.values(groups).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    }, [requests]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;
    if (error) return <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8 text-center"><h1 className="text-3xl text-red-500 font-bold mb-4">Oops!</h1><p className="text-lg">{error}</p><Link to="/"><Button variant="link" className="mt-8 text-blue-400">Go back home</Button></Link></div>;

    const songsToDisplay = songs.filter(song => {
        if (!liveStatus?.is_live) return true;
        if (!liveStatus.active_song_tags || liveStatus.active_song_tags.length === 0) return true;
        if (!song.tags || song.tags.length === 0) return true;
        return song.tags?.some(tag => liveStatus.active_song_tags.includes(tag));
    });
    
    const playedSongIds = requests.filter(r => r.status === 'played').map(r => r.song_id);

    return (
        <TooltipProvider>
            <Helmet>
                <title>{`${artist.artist_name} - Your Song Request`}</title>
                <meta name="description" content={`Request songs from ${artist.artist_name} during their live performances. View their setlist and upcoming gigs.`} />
            </Helmet>
            <div className="min-h-screen bg-black text-white">
                <header className="py-8 relative text-center border-b border-gray-800 bg-gray-900/30">
                     <div className="absolute top-4 left-4">
                        <Link to="/"><Button variant="link" className="text-gray-400 hover:text-white">&lt;- Your Song Request</Button></Link>
                    </div>
                    {artist.profile_picture_url ? (
                        <img src={artist.profile_picture_url} alt={`${artist.artist_name} profile picture`} className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gray-700 object-cover" />
                    ) : (
                        <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-5xl border-4 border-gray-700">{artist.artist_name.charAt(0).toUpperCase()}</div>
                    )}
                    <h1 className="text-5xl font-bold neon-text">{artist.artist_name}</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto mt-4">{artist.bio}</p>

                    <div className="flex justify-center space-x-4 mt-4">
                        {artist.social_facebook && <SocialIcon platform="facebook" handle={artist.social_facebook} />}
                        {artist.social_x && <SocialIcon platform="x" handle={artist.social_x} />}
                        {artist.social_instagram && <SocialIcon platform="instagram" handle={artist.social_instagram} />}
                        {artist.social_tiktok && <SocialIcon platform="tiktok" handle={artist.social_tiktok} />}
                    </div>

                    {liveStatus?.is_live && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-4 inline-flex items-center space-x-4 bg-red-900/50 text-red-300 font-semibold px-6 py-2 rounded-full border border-red-700">
                           <Radio className="animate-pulse" />
                           <span>LIVE NOW</span>
                           {timeLeft && <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5"/>{timeLeft}</span>}
                        </motion.div>
                    )}
                </header>
                <main className="max-w-7xl mx-auto p-4 sm:p-8">
                     <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {liveStatus?.is_live ? (
                                 <Card className="glass-effect border-purple-500/50">
                                    <CardHeader>
                                        <CardTitle className="text-purple-300 flex items-center"><Music className="mr-3"/>Live Request Queue</CardTitle>
                                        <CardDescription>Songs requested by the audience during this live set.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {liveRequests.length > 0 ? (
                                             <div className="space-y-4">
                                                {liveRequests.map((req, i) => (
                                                    <motion.div key={req.song_id} initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: i * 0.1}}>
                                                        <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-lg">
                                                            <div>
                                                                <p className="font-bold text-lg text-blue-300">{req.song_title}</p>
                                                                <p className="text-sm text-gray-400">by {req.original_artist}</p>
                                                            </div>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button className="flex items-center space-x-1 text-purple-400">
                                                                        <User className="w-4 h-4" />
                                                                        <span className="font-bold">{req.requester_count}</span>
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{req.requester_count} {req.requester_count === 1 ? 'person has' : 'people have'} requested this. Show your support and request it too!</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                             </div>
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">There's nothing here yet, be the first to request a song!</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="glass-effect border-gray-800">
                                    <CardHeader>
                                        <CardTitle className="flex items-center text-gray-400"><Radio className="mr-3"/>Currently Offline</CardTitle>
                                        <CardDescription>The artist is not currently live. Check out their available songs and upcoming gigs below.</CardDescription>
                                    </CardHeader>
                                </Card>
                            )}
                            <Card className="glass-effect border-gray-800">
                                <CardHeader><CardTitle className="flex items-center"><Music className="mr-3"/>Request a Song</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {songsToDisplay.length > 0 ? songsToDisplay.map((song) => <SongCard key={song.id} song={song} artistId={artist.id} toast={toast} isPlayed={playedSongIds.includes(song.id)} isLive={liveStatus?.is_live} />) : <p className="text-center text-gray-500 py-8">No songs available for request right now.</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-8">
                             <TipJarCard artist={artist} toast={toast}/>
                             <GigList gigs={gigs} />
                        </div>
                    </div>
                </main>
            </div>
        </TooltipProvider>
    );
};

const SongCard = ({ song, artistId, toast, isPlayed, isLive }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [tip, setTip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!requesterName) {
      toast({title: "Oops!", description: "Please enter your name.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    const tipAmount = parseFloat(tip) || 0;
    const totalPaid = Number(song.price) + tipAmount;

    const { data, error } = await supabase.from('requests').insert({
      artist_id: artistId,
      song_id: song.id,
      song_title: song.title,
      original_artist: song.original_artist,
      requester_name: requesterName,
      requester_email: email,
      note,
      amount_paid: totalPaid,
      tip: tipAmount,
      is_tip_only: false,
      status: 'pending'
    });

    if (error) {
      toast({ title: "Error", description: `Could not submit request. Please try again. ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Request Sent!", description: `Your request for "${song.title}" has been sent.` });
      setDialogOpen(false);
      setRequesterName(''); setEmail(''); setNote(''); setTip('');
    }
    setIsSubmitting(false);
  };
  
  return (
    <>
      <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-lg">
        <div>
            <p className={`font-bold text-lg ${isPlayed ? 'text-gray-600 line-through' : 'text-blue-300'}`}>{song.title}</p>
            <p className={`text-sm ${isPlayed ? 'text-gray-700' : 'text-gray-400'}`}>by {song.original_artist}</p>
        </div>
        <div className="text-right">
            <p className={`font-semibold text-xl ${isPlayed ? 'text-gray-600' : 'text-green-400'}`}>£{Number(song.price).toFixed(2)}</p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" className="h-auto p-0 text-blue-400 hover:text-blue-300 disabled:text-gray-600" disabled={isPlayed || !isLive}>{isPlayed ? 'Played' : (isLive ? 'Request' : 'Offline')}</Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader><DialogTitle>Request "{song.title}"</DialogTitle><DialogDescription>Your request will be sent to the artist in real-time.</DialogDescription></DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div><Label htmlFor={`name-${song.id}`}>Your Name</Label><Input id={`name-${song.id}`} value={requesterName} onChange={e => setRequesterName(e.target.value)} required className="bg-gray-800 border-gray-600" /></div>
                      <div><Label htmlFor={`email-${song.id}`}>Email (optional - for a receipt)</Label><Input id={`email-${song.id}`} type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-gray-800 border-gray-600" /></div>
                      <div><Label htmlFor={`note-${song.id}`}>Note for artist (optional)</Label><Textarea id={`note-${song.id}`} value={note} onChange={e => setNote(e.target.value)} className="bg-gray-800 border-gray-600" /></div>
                      <div><Label htmlFor={`tip-${song.id}`}>Add a tip? (optional)</Label><Input id={`tip-${song.id}`} type="number" step="0.01" value={tip} onChange={e => setTip(e.target.value)} placeholder="e.g., 5.00" className="bg-gray-800 border-gray-600" /></div>
                      <p className="text-lg text-right font-bold">Total: £{(Number(song.price) + (parseFloat(tip) || 0)).toFixed(2)}</p>
                      <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 neon-glow"><Send className="w-4 h-4 mr-2" /> {isSubmitting ? 'Sending...' : 'Send Request'}</Button>
                  </form>
                </DialogContent>
            </Dialog>
        </div>
      </div>
    </>
  );
};

const TipJarCard = ({ artist, toast }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [requesterName, setRequesterName] = useState('');
    const [note, setNote] = useState('');
    const [tip, setTip] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!requesterName || !tip || parseFloat(tip) <= 0) {
            toast({title: "Oops!", description: "Please enter your name and a valid tip amount.", variant: "destructive"});
            return;
        }
        setIsSubmitting(true);
        const { error } = await supabase.from('requests').insert({
            artist_id: artist.id, song_id: null, song_title: "Tip Jar", requester_name: requesterName,
            note, amount_paid: parseFloat(tip), tip: parseFloat(tip), is_tip_only: true, status: 'completed'
        });
        if (error) {
            toast({ title: "Error", description: "Could not send tip. Please try again.", variant: "destructive" });
        } else {
            toast({ title: "Tip Sent!", description: `Thank you for supporting ${artist.artist_name}!` });
            setDialogOpen(false);
            setRequesterName(''); setNote(''); setTip('');
        }
        setIsSubmitting(false);
    };

    return (
        <>
            <Card className="glass-effect border-yellow-500/50">
                <CardHeader className="text-center"><CardTitle className="text-yellow-300 flex items-center justify-center"><Heart className="mr-3"/>Tip Jar</CardTitle><CardDescription>Enjoying the show? Show your appreciation!</CardDescription></CardHeader>
                <CardContent className="text-center">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild><Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"><DollarSign className="w-4 h-4 mr-2"/>Send a Tip</Button></DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700 text-white">
                            <DialogHeader><DialogTitle>Send a Tip to {artist.artist_name}</DialogTitle><DialogDescription>Your generosity is greatly appreciated!</DialogDescription></DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div><Label htmlFor="tip-name">Your Name</Label><Input id="tip-name" value={requesterName} onChange={e => setRequesterName(e.target.value)} required className="bg-gray-800 border-gray-600" /></div>
                                <div><Label htmlFor="tip-amount">Tip Amount (£)</Label><Input id="tip-amount" type="number" step="0.01" min="0.50" value={tip} onChange={e => setTip(e.target.value)} placeholder="5.00" required className="bg-gray-800 border-gray-600" /></div>
                                <div><Label htmlFor="tip-note">Note for artist (optional)</Label><Textarea id="tip-note" value={note} onChange={e => setNote(e.target.value)} className="bg-gray-800 border-gray-600" /></div>
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"><Heart className="w-4 h-4 mr-2" />{isSubmitting ? 'Sending...' : 'Send Tip'}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </>
    );
};

const GigList = ({ gigs }) => {
    if (gigs.length === 0) return null;
    const upcomingGigs = gigs.filter(g => new Date(g.date) >= new Date(new Date().setHours(0,0,0,0)));
    return (
        <Card className="glass-effect border-gray-800">
            <CardHeader><CardTitle className="flex items-center"><Calendar className="mr-3"/>Upcoming Gigs</CardTitle></CardHeader>
            <CardContent>
                {upcomingGigs.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingGigs.map(gig => (
                            <div key={gig.id} className="p-3 bg-gray-900/50 rounded-lg">
                                <p className="font-semibold">{new Date(gig.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-gray-300">{gig.venue_name}</p>
                                <p className="text-sm text-gray-500">{new Date(`1970-01-01T${gig.time}Z`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})}</p>
                                {gig.show_map && (gig.address || gig.postcode) && <p className="text-sm text-gray-400 flex items-start mt-1"><MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"/>{gig.address}{gig.postcode && `, ${gig.postcode}`}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No upcoming gigs scheduled. Check back soon!</p>
                )}
            </CardContent>
        </Card>
    );
};


export default ArtistPage;
