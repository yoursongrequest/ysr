import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Music, DollarSign, Calendar, Clock, User, Send, Gift } from 'lucide-react';

const ArtistPage = () => {
  const { artistId } = useParams();
  const { toast } = useToast();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [upcomingGigs, setUpcomingGigs] = useState([]);
  const [liveStatus, setLiveStatus] = useState({ isLive: false, requestCap: 0 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isTipDialogOpen, setIsTipDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ name: '', email: '', note: '', tip: '' });
  const [tipForm, setTipForm] = useState({ name: '', email: '', note: '', tip: '' });

  useEffect(() => {
    const loadData = () => {
      try {
        const users = JSON.parse(localStorage.getItem('ysr_users') || '[]');
        const artistData = users.find(user => user.id === artistId);
        
        if (!artistData) {
          setLoading(false);
          return;
        }
        setArtist(artistData);

        const artistSongs = JSON.parse(localStorage.getItem(`ysr_songs_${artistId}`) || '[]');
        setSongs(artistSongs);

        const artistGigs = JSON.parse(localStorage.getItem(`ysr_gigs_${artistId}`) || '[]');
        const upcoming = artistGigs.filter(gig => new Date(gig.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingGigs(upcoming);

        const status = JSON.parse(localStorage.getItem(`ysr_live_status_${artistId}`) || '{"isLive": false, "requestCap": 0}');
        setLiveStatus(status);

        const currentRequests = JSON.parse(localStorage.getItem(`ysr_requests_${artistId}`) || '[]');
        setRequests(currentRequests);

        setLoading(false);
      } catch (error) {
        console.error('Error loading artist data:', error);
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 2000); // Poll for updates every 2 seconds
    return () => clearInterval(interval);
  }, [artistId]);

  const handleRequestClick = (song) => {
    setSelectedSong(song);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const newRequest = {
      id: Date.now(),
      songId: selectedSong.id,
      songTitle: selectedSong.title,
      requesterName: paymentForm.name,
      requesterEmail: paymentForm.email,
      note: paymentForm.note,
      amountPaid: selectedSong.price + (parseFloat(paymentForm.tip) || 0),
      tip: parseFloat(paymentForm.tip) || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const currentRequests = JSON.parse(localStorage.getItem(`ysr_requests_${artistId}`) || '[]');
    localStorage.setItem(`ysr_requests_${artistId}`, JSON.stringify([...currentRequests, newRequest]));
    setRequests([...currentRequests, newRequest]);

    toast({
      title: "Request Sent!",
      description: `Your request for "${selectedSong.title}" has been sent to the artist.`,
    });
    setIsPaymentDialogOpen(false);
    setPaymentForm({ name: '', email: '', note: '', tip: '' });
  };
  
  const handleTipSubmit = (e) => {
    e.preventDefault();
    const newTip = {
      id: Date.now(),
      requesterName: tipForm.name,
      requesterEmail: tipForm.email,
      note: tipForm.note,
      amountPaid: parseFloat(tipForm.tip) || 0,
      isTipOnly: true,
      createdAt: new Date().toISOString(),
    };

    const currentRequests = JSON.parse(localStorage.getItem(`ysr_requests_${artistId}`) || '[]');
    localStorage.setItem(`ysr_requests_${artistId}`, JSON.stringify([...currentRequests, newTip]));

    toast({
      title: "Tip Sent!",
      description: `Thank you for your generous tip!`,
    });
    setIsTipDialogOpen(false);
    setTipForm({ name: '', email: '', note: '', tip: '' });
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;
  if (!artist) return <div className="min-h-screen bg-black flex items-center justify-center px-4"><Card className="glass-effect border-gray-800 text-center max-w-md"><CardContent className="p-8"><User className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h2 className="text-2xl font-bold text-white mb-2">Artist Not Found</h2><p className="text-gray-400 mb-6">The artist you're looking for doesn't exist.</p><Link to="/"><Button className="bg-blue-600 hover:bg-blue-700 text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button></Link></CardContent></Card></div>;

  const requestsReachedCap = liveStatus.requestCap > 0 && requests.filter(r => !r.isTipOnly).length >= liveStatus.requestCap;

  return (
    <>
      <Helmet>
        <title>{artist.artistName} - Your Song Request</title>
        <meta name="description" content={`Request songs from ${artist.artistName}. ${artist.bio || ''}`} />
      </Helmet>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
            <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
            {liveStatus.isLive && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                <span className="text-red-400 font-bold">LIVE</span>
              </motion.div>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="glass-effect border-gray-800 mb-8">
              <CardContent className="p-8 flex items-start space-x-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                  {artist.profilePicture ? <img src={artist.profilePicture} alt={artist.artistName} className="w-24 h-24 rounded-full object-cover" onError={(e) => e.target.style.display = 'none'} /> : artist.artistName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2 neon-text">{artist.artistName}</h1>
                  {artist.bio && <p className="text-gray-300 text-lg leading-relaxed">{artist.bio}</p>}
                </div>
              </CardContent>
            </Card>

            {liveStatus.isLive ? (
              <div>
                {requestsReachedCap && (
                  <Card className="bg-yellow-900/50 border-yellow-600 text-center py-4 mb-6">
                    <CardContent className="p-2">
                      <p className="font-semibold text-yellow-300">The artist is not taking any more requests right now, but you can still send a tip!</p>
                    </CardContent>
                  </Card>
                )}
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-white mb-6">Request a Song</h2>
                    {songs.length === 0 ? (
                      <Card className="glass-effect border-gray-800 text-center py-12"><CardContent><Music className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">No songs available</h3><p className="text-gray-400">This artist hasn't added any songs to their setlist yet.</p></CardContent></Card>
                    ) : (
                      <div className="grid gap-4">
                        {songs.map((song, i) => (
                          <motion.div key={song.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                            <Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300">
                              <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex-1"><h3 className="text-lg font-semibold text-white mb-1">{song.title}</h3><p className="text-gray-400 mb-3">by {song.originalArtist}</p><div className="flex items-center text-green-400"><DollarSign className="w-4 h-4 mr-1" /><span className="font-semibold">£{song.price.toFixed(2)}</span></div></div>
                                <Button onClick={() => handleRequestClick(song)} disabled={requestsReachedCap} className="bg-blue-600 hover:bg-blue-700 text-white neon-glow disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Request</Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Send a Tip</h2>
                    <Card className="glass-effect border-gray-800">
                      <CardContent className="p-6 text-center">
                        <Gift className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                        <p className="text-gray-300 mb-4">Enjoying the show? Show your appreciation!</p>
                        <Button onClick={() => setIsTipDialogOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold w-full">Send a Tip</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Upcoming Shows</h2>
                {upcomingGigs.length === 0 ? (
                  <Card className="glass-effect border-gray-800 text-center py-12"><CardContent><Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">No upcoming shows</h3><p className="text-gray-400">Check back later for new performances!</p></CardContent></Card>
                ) : (
                  <div className="space-y-4">
                    {upcomingGigs.map((gig, i) => (
                      <motion.div key={gig.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                        <Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300"><CardContent className="p-6 flex items-center space-x-4"><div className="text-center w-16"><p className="text-2xl font-bold">{new Date(gig.date).getDate()}</p><p className="text-sm uppercase text-gray-400">{new Date(gig.date).toLocaleString('default', { month: 'short' })}</p></div><div className="border-l border-gray-700 pl-4 flex-1"><h3 className="font-bold text-lg">{gig.venueName}</h3><p className="text-gray-400">{formatDate(gig.date)} at {gig.time}</p></div></CardContent></Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </main>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader><DialogTitle>Request "{selectedSong?.title}"</DialogTitle><DialogDescription>Fill out the form below to send your request. Payment processing is currently simulated.</DialogDescription></DialogHeader>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div><Label htmlFor="name">Your Name</Label><Input id="name" value={paymentForm.name} onChange={(e) => setPaymentForm({...paymentForm, name: e.target.value})} required className="bg-gray-800 border-gray-600" /></div>
              <div><Label htmlFor="email">Your Email</Label><Input id="email" type="email" value={paymentForm.email} onChange={(e) => setPaymentForm({...paymentForm, email: e.target.value})} required className="bg-gray-800 border-gray-600" /></div>
              <div><Label htmlFor="note">Note for Artist (optional)</Label><Textarea id="note" value={paymentForm.note} onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})} className="bg-gray-800 border-gray-600" /></div>
              <div><Label htmlFor="tip">Add a Tip (optional)</Label><Input id="tip" type="number" step="0.01" min="0" value={paymentForm.tip} onChange={(e) => setPaymentForm({...paymentForm, tip: e.target.value})} placeholder="e.g., 5.00" className="bg-gray-800 border-gray-600" /></div>
              <DialogFooter>
                <p className="mr-auto text-lg font-bold">Total: £{(selectedSong?.price + (parseFloat(paymentForm.tip) || 0)).toFixed(2)}</p>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Submit Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Tip Dialog */}
        <Dialog open={isTipDialogOpen} onOpenChange={setIsTipDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader><DialogTitle>Send a Tip</DialogTitle><DialogDescription>Show your appreciation for {artist.artistName}.</DialogDescription></DialogHeader>
            <form onSubmit={handleTipSubmit} className="space-y-4">
              <div><Label htmlFor="tip-amount">Tip Amount (£)</Label><Input id="tip-amount" type="number" step="0.01" min="0" value={tipForm.tip} onChange={(e) => setTipForm({...tipForm, tip: e.target.value})} required placeholder="e.g., 10.00" className="bg-gray-800 border-gray-600" /></div>
              <div><Label htmlFor="tip-name">Your Name</Label><Input id="tip-name" value={tipForm.name} onChange={(e) => setTipForm({...tipForm, name: e.target.value})} required className="bg-gray-800 border-gray-600" /></div>
              <div><Label htmlFor="tip-email">Your Email</Label><Input id="tip-email" type="email" value={tipForm.email} onChange={(e) => setTipForm({...tipForm, email: e.target.value})} required className="bg-gray-800 border-gray-600" /></div>
              <div><Label htmlFor="tip-note">Note for Artist (optional)</Label><Textarea id="tip-note" value={tipForm.note} onChange={(e) => setTipForm({...tipForm, note: e.target.value})} className="bg-gray-800 border-gray-600" /></div>
              <DialogFooter>
                <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Send Tip</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ArtistPage;