
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Music, Plus, Edit, Trash2, DollarSign } from 'lucide-react';

const SetlistPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [songs, setSongs] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    originalArtist: '',
    price: ''
  });

  useEffect(() => {
    loadSongs();
  }, [user]);

  const loadSongs = () => {
    if (user) {
      const savedSongs = JSON.parse(localStorage.getItem(`ysr_songs_${user.id}`) || '[]');
      setSongs(savedSongs);
    }
  };

  const saveSongs = (updatedSongs) => {
    if (user) {
      localStorage.setItem(`ysr_songs_${user.id}`, JSON.stringify(updatedSongs));
      setSongs(updatedSongs);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.originalArtist || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    const songData = {
      id: editingSong ? editingSong.id : Date.now().toString(),
      title: formData.title,
      originalArtist: formData.originalArtist,
      price: price,
      createdAt: editingSong ? editingSong.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedSongs;
    if (editingSong) {
      updatedSongs = songs.map(song => song.id === editingSong.id ? songData : song);
      toast({
        title: "Song updated!",
        description: "Your song has been successfully updated.",
      });
    } else {
      updatedSongs = [...songs, songData];
      toast({
        title: "Song added!",
        description: "Your song has been added to the setlist.",
      });
    }

    saveSongs(updatedSongs);
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (song) => {
    setEditingSong(song);
    setFormData({
      title: song.title,
      originalArtist: song.originalArtist,
      price: song.price.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (songId) => {
    const updatedSongs = songs.filter(song => song.id !== songId);
    saveSongs(updatedSongs);
    toast({
      title: "Song deleted",
      description: "The song has been removed from your setlist.",
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      originalArtist: '',
      price: ''
    });
    setEditingSong(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <>
      <Helmet>
        <title>Setlist Management - Your Song Request</title>
        <meta name="description" content="Manage your song catalog with custom pricing for each song in your setlist." />
        <meta property="og:title" content="Setlist Management - Your Song Request" />
        <meta property="og:description" content="Manage your song catalog with custom pricing for each song in your setlist." />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
                <span className="text-2xl font-bold neon-text">Setlist Management</span>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Song
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>{editingSong ? 'Edit Song' : 'Add New Song'}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingSong ? 'Update the song details below.' : 'Add a new song to your setlist with custom pricing.'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Song Title</Label>
                        <Input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="bg-gray-800 border-gray-600"
                          placeholder="Enter song title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="originalArtist">Original Artist</Label>
                        <Input
                          id="originalArtist"
                          name="originalArtist"
                          value={formData.originalArtist}
                          onChange={handleInputChange}
                          className="bg-gray-800 border-gray-600"
                          placeholder="Enter original artist name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (£)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="bg-gray-800 border-gray-600"
                          placeholder="3.00"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingSong ? 'Update Song' : 'Add Song'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {songs.length === 0 ? (
              <Card className="glass-effect border-gray-800 text-center py-12">
                <CardContent>
                  <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No songs in your setlist yet</h3>
                  <p className="text-gray-400 mb-6">Start building your setlist by adding songs with custom pricing</p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={resetForm}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Song
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Your Setlist</h2>
                    <p className="text-gray-400">{songs.length} song{songs.length !== 1 ? 's' : ''} in your catalog</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {songs.map((song, index) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">{song.title}</h3>
                              <p className="text-gray-400 mb-2">by {song.originalArtist}</p>
                              <div className="flex items-center text-green-400">
                                <DollarSign className="w-4 h-4 mr-1" />
                                <span className="font-semibold">£{song.price.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(song)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(song.id)}
                                className="border-red-600 text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default SetlistPage;
