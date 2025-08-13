
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Music, Send } from 'lucide-react';

function SongItem({ song, artistId, onSuccessfulRequest }) {
  const [requesterName, setRequesterName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRequest = async () => {
    if (!requesterName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to make a request.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    const { error } = await supabase
      .from('requests')
      .insert([{
        song_id: song.id,
        artist_id: artistId,
        song_title: song.title,
        original_artist: song.original_artist,
        requester_name: requesterName,
        amount_paid: song.price,
        status: 'pending'
      }]);

    if (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Could not submit request. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request Sent!",
        description: `Thanks, ${requesterName}! Your request for "${song.title}" has been sent.`,
      });
      onSuccessfulRequest(song.id);
      setIsDialogOpen(false);
      setRequesterName('');
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border border-gray-700 rounded-lg shadow-md bg-gray-800/50 text-white flex justify-between items-center"
    >
      <div>
        <h3 className="text-xl font-bold">{song.title}</h3>
        <p className="text-sm text-gray-400">by {song.original_artist}</p>
        <p className="font-bold text-lg text-blue-400 mt-1">£{song.price ? Number(song.price).toFixed(2) : '0.00'}</p>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Request</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Request "{song.title}"</DialogTitle>
            <DialogDescription>
              Enter your name to send your request to the artist. The request price is £{song.price ? Number(song.price).toFixed(2) : '0.00'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="name"
              placeholder="Your Name"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRequest} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Confirm Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default function RequestsPage() {
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestedSongIds, setRequestedSongIds] = useState([]);
  const { artistUrlSlug } = useParams();

  useEffect(() => {
    async function fetchArtistAndSongs() {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          artist_name,
          songs (*),
          live_status (*)
        `)
        .eq('url_slug', artistUrlSlug)
        .eq('live_status.is_live', true)
        .single();
        
      if (profileError || !profileData) {
        console.error('Error fetching artist or artist is not live:', profileError);
        setArtist(null);
      } else {
        setArtist(profileData);
        
        const activeTags = profileData.live_status[0]?.active_song_tags;
        
        let availableSongs = profileData.songs;

        if (activeTags && activeTags.length > 0) {
            availableSongs = profileData.songs.filter(song => 
                !song.tags || song.tags.length === 0 || song.tags.some(tag => activeTags.includes(tag))
            );
        }
        
        setSongs(availableSongs.filter(song => !song.is_played));
      }
      setLoading(false);
    }

    if (artistUrlSlug) {
      fetchArtistAndSongs();
    }
  }, [artistUrlSlug]);
  
  const handleSuccessfulRequest = (songId) => {
    setRequestedSongIds(prev => [...prev, songId]);
  };

  if (loading) {
    return <div className="text-center p-10 text-white">Loading available songs...</div>;
  }
  
  if (!artist) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
              <h1 className="text-4xl font-bold mb-4">Artist Not Found or Not Live</h1>
              <p className="text-lg text-gray-400">This artist page doesn't exist, or they are not currently live for requests.</p>
              <Link to="/">
                  <Button className="mt-8">Go to Homepage</Button>
              </Link>
          </div>
      );
  }

  const availableSongs = songs.filter(song => !requestedSongIds.includes(song.id));

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen">
      <Helmet>
        <title>Live Requests for {artist.artist_name}</title>
        <meta name="description" content={`Request a song from ${artist.artist_name} during their live performance.`} />
      </Helmet>
      <header className="text-center my-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white multi-glow-1">Live Song Requests</h1>
        <p className="text-xl text-gray-300 mt-2">for <span className="text-blue-400 font-bold">{artist.artist_name}</span></p>
      </header>

      {availableSongs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableSongs.map((song) => (
            <SongItem key={song.id} song={song} artistId={artist.id} onSuccessfulRequest={handleSuccessfulRequest} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
            <Music className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-4 text-xl font-semibold text-white">No Songs Available</h3>
            <p className="mt-2 text-gray-400">All songs have been requested, or the artist has not made any songs available for requests.</p>
        </div>
      )}
    </div>
  );
}
