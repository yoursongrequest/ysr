import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Music, Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const SetlistPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [formData, setFormData] = useState({ title: '', original_artist: '', price: '' });

  const loadSongs = useCallback(async () => {
    if (user) {
      setLoading(true);
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: "Error", description: "Failed to load songs.", variant: "destructive" });
      } else {
        setSongs(data);
      }
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.original_artist || !formData.price) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast({ title: "Error", description: "Please enter a valid price.", variant: "destructive" });
      return;
    }

    const songData = { ...formData, user_id: user.id, price };
    let error;

    if (editingSong) {
      const { error: updateError } = await supabase.from('songs').update(songData).eq('id', editingSong.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('songs').insert(songData);
      error = insertError;
    }

    if (error) {
      toast({ title: "Error saving song", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Song ${editingSong ? 'updated' : 'added'}!`, description: `Your song has been successfully ${editingSong ? 'updated' : 'added'}.` });
      loadSongs();
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const handleEdit = (song) => {
    setEditingSong(song);
    setFormData({ title: song.title, original_artist: song.original_artist, price: song.price.toString() });
    setIsDialogOpen(true);
  };

  const handleDelete = async (songId) => {
    const { error } = await supabase.from('songs').delete().eq('id', songId);
    if (error) {
      toast({ title: "Error deleting song", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Song deleted", description: "The song has been removed." });
      loadSongs();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', original_artist: '', price: '' });
    setEditingSong(null);
  };
  
  const handleDialogClose = () => {
    resetForm();
    setIsDialogOpen(false);
  }

  return (
    <>
      <Helmet>
        <title>Setlist Management - Your Song Request</title>
        <meta name="description" content="Manage your song catalog with custom pricing." />
      </Helmet>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center"><Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Link><span className="text-2xl font-bold neon-text">Setlist</span></div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={resetForm}><Plus className="w-4 h-4 mr-2" />Add Song</Button></DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader><DialogTitle>{editingSong ? 'Edit Song' : 'Add New Song'}</DialogTitle><DialogDescription className="text-gray-400">{editingSong ? 'Update song details.' : 'Add a new song to your setlist.'}</DialogDescription></DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label htmlFor="title">Song Title</Label><Input id="title" name="title" value={formData.title} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="Enter song title" /></div>
                      <div className="space-y-2"><Label htmlFor="original_artist">Original Artist</Label><Input id="original_artist" name="original_artist" value={formData.original_artist} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="Enter original artist" /></div>
                      <div className="space-y-2"><Label htmlFor="price">Price (£)</Label><Input id="price" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="3.00" /></div>
                    </div>
                    <DialogFooter><Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingSong ? 'Update Song' : 'Add Song'}</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {loading ? <div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div></div> :
            songs.length === 0 ? (
              <Card className="glass-effect border-gray-800 text-center py-12"><CardContent><Music className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">No songs in your setlist</h3><p className="text-gray-400 mb-6">Build your setlist by adding songs.</p><Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add First Song</Button></CardContent></Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6"><div><h2 className="text-2xl font-bold text-white">Your Setlist</h2><p className="text-gray-400">{songs.length} song{songs.length !== 1 ? 's' : ''}</p></div></div>
                <div className="grid gap-4">{songs.map((song, i) => <motion.div key={song.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}><Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="flex-1"><h3 className="text-lg font-semibold text-white mb-1">{song.title}</h3><p className="text-gray-400 mb-2">by {song.original_artist}</p><div className="flex items-center text-green-400"><DollarSign className="w-4 h-4 mr-1" /><span className="font-semibold">£{Number(song.price).toFixed(2)}</span></div></div><div className="flex items-center space-x-2"><Button size="sm" variant="outline" onClick={() => handleEdit(song)} className="border-gray-600 text-gray-300 hover:bg-gray-800"><Edit className="w-4 h-4" /></Button><Button size="sm" variant="outline" onClick={() => handleDelete(song.id)} className="border-red-600 text-red-400 hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></Button></div></div></CardContent></Card></motion.div>)}</div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default SetlistPage;