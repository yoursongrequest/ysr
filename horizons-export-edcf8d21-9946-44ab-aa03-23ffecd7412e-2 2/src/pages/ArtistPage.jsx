import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Instagram, Ticket, Music, MapPin, Calendar, Clock, Wifi, WifiOff } from 'lucide-react';
import { Helmet } from 'react-helmet';
import QRCode from 'qrcode.react';

const SocialLink = ({ url, icon: Icon, brandName }) => {
  if (!url) return null;
  const fullUrl = url.startsWith('http') ? url : `https://www.${brandName}.com/${url}`;
  return (
    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
      <Icon className="w-6 h-6" />
    </a>
  );
};

const ArtistPage = () => {
  const { artistUrlSlug } = useParams();
  const [artist, setArtist] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingGig, setUpcomingGig] = useState(null);

  const publicPageUrl = `${window.location.origin}/${artistUrlSlug}`;
  const requestPageUrl = `${window.location.origin}/${artistUrlSlug}/requests`;

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        setLoading(true);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, live_status(*), gigs(*)')
          .eq('url_slug', artistUrlSlug)
          .single();

        if (profileError || !profileData) {
          throw new Error('Artist not found.');
        }

        setArtist(profileData);
        
        const currentLiveStatus = profileData.live_status && profileData.live_status.length > 0 ? profileData.live_status[0] : { is_live: false };
        setLiveStatus(currentLiveStatus);

        const today = new Date().toISOString().split('T')[0];
        const upcoming = profileData.gigs
          .filter(gig => gig.date >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (upcoming.length > 0) {
          setUpcomingGig(upcoming[0]);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();

    const liveStatusChannel = supabase
        .channel(`public:live_status:user_id=eq.${artist?.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_status', filter: `user_id=eq.${artist?.id}`}, payload => {
            setLiveStatus(payload.new);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(liveStatusChannel);
    };

  }, [artistUrlSlug, artist?.id]);


  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-white">Loading artist profile...</div>;
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-4xl font-bold mb-4">Artist Not Found</h1>
            <p className="text-lg text-gray-400">{error}</p>
            <Link to="/">
                <Button className="mt-8">Go to Homepage</Button>
            </Link>
        </div>
    );
  }

  const isLive = liveStatus?.is_live;

  return (
    <>
      <Helmet>
        <title>{artist.artist_name} | Your Song Request</title>
        <meta name="description" content={`Check out ${artist.artist_name}'s profile. See upcoming gigs and request songs when they are live!`} />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="relative text-center mb-8 p-8 bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${isLive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {isLive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isLive ? 'LIVE NOW' : 'OFFLINE'}</span>
            </div>
            <img  alt={`${artist.artist_name} profile picture`} className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-blue-500 object-cover shadow-md" src="https://images.unsplash.com/photo-1532586539-30f58a60677a" />
            <h1 className="text-4xl sm:text-5xl font-extrabold">{artist.artist_name}</h1>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">{artist.bio}</p>
            <div className="flex justify-center space-x-4 mt-4">
              <SocialLink url={artist.social_facebook} icon={Facebook} brandName="facebook" />
              <SocialLink url={artist.social_x} icon={Twitter} brandName="x" />
              <SocialLink url={artist.social_instagram} icon={Instagram} brandName="instagram" />
              <SocialLink url={artist.social_tiktok} icon={Ticket} brandName="tiktok" />
            </div>
          </header>

          {/* Live Actions */}
          {isLive && (
            <div className="bg-blue-900/30 border border-blue-500/50 p-8 rounded-xl mb-8 text-center shadow-lg">
              <h2 className="text-3xl font-bold mb-4">Request a Song!</h2>
              <p className="text-blue-200 mb-6">Scan the QR code with your phone or click the button below to see the setlist and make a request.</p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="bg-white p-4 rounded-lg">
                  <QRCode value={requestPageUrl} size={128} bgColor="#ffffff" fgColor="#000000" level="H" />
                </div>
                <div>
                  <Link to={`/${artistUrlSlug}/requests`}>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-8 w-full md:w-auto">
                      <Music className="mr-2 h-5 w-5" /> View Setlist & Request
                    </Button>
                  </Link>
                  <p className="text-xs text-blue-300 mt-2">or go to: <span className="font-mono">{publicPageUrl}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Gig */}
          {upcomingGig && (
             <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">Next Gig</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-500"/>
                        <span>{new Date(upcomingGig.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-500"/>
                        <span>{upcomingGig.time.substring(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                        <MapPin className="w-5 h-5 text-blue-500"/>
                        <span>{upcomingGig.venue_name}, {upcomingGig.address}</span>
                    </div>
                </div>
             </div>
          )}
          
          {!isLive && !upcomingGig && (
            <div className="text-center p-8 bg-gray-800 rounded-xl">
              <h2 className="text-2xl font-bold">No Upcoming Gigs</h2>
              <p className="text-gray-400 mt-2">Check back soon for new dates!</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default ArtistPage;
