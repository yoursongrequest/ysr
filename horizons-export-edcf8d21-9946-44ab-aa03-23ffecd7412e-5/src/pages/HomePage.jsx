import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

function SongItem({ song }) {
  const handleRequest = () => {
    alert(`Requesting ${song.title}`);
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-gray-800 text-white">
      <h3 className="text-xl font-bold">{song.title}</h3>
      <p>Price: ${song.price || '0.00'}</p>
      <button
        onClick={handleRequest}
        className="mt-2 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
      >
        Request
      </button>
    </div>
  );
}

export default function HomePage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAvailableSongs() {
      setLoading(true);
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('is_played', false);

      if (error) {
        console.error('Error fetching songs:', error);
      } else {
        setSongs(data);
      }
      setLoading(false);
    }

    fetchAvailableSongs();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading available songs...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Available Songs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {songs.length > 0 ? (
          songs.map((song) => <SongItem key={song.id} song={song} />)
        ) : (
          <p className="col-span-full text-center">No songs available for request right now.</p>
        )}
      </div>
    </div>
  );
}