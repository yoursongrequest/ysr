import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function ArtistPage() {
  const { user, signOut } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSongs();
    }
  }, [user]);

  async function fetchSongs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('songs')
      .select('*')

    if (error) {
      console.error('Error fetching songs:', error);
    } else {
      setSongs(data);
    }
    setLoading(false);
  }

  async function handleMarkAsPlayed(songId) {
    const { error } = await supabase
      .from('songs')
      .update({ is_played: true })
      .eq('id', songId);

    if (error) {
      alert('Error updating song status.');
      console.error(error);
    } else {
      fetchSongs();
    }
  }

  if (!user) {
    return <div>Loading user... Please login.</div>;
  }

  const incomingSongs = songs.filter(song => !song.is_played);
  const completedSongs = songs.filter(song => song.is_played);

  return (
    <div className="p-4 text-white">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Artist Dashboard</h1>
        <button onClick={signOut} className="px-4 py-2 bg-red-500 rounded">Logout</button>
      </header>

      <main className="grid md:grid-cols-2 gap-6">
        <section className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {incomingSongs.map(song => (
                <li key={song.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span>{song.title}</span>
                  <button onClick={() => handleMarkAsPlayed(song.id)} className="px-3 py-1 bg-green-500 rounded text-sm">Mark As Played</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Completed Songs</h2>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {completedSongs.map(song => (
                <li key={song.id} className="bg-gray-700 p-2 rounded opacity-60">
                  {song.title}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}