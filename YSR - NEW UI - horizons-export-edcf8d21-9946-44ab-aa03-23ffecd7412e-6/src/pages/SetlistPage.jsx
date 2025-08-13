
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
import { ArrowLeft, Music, Plus, Edit, Trash2, GripVertical, CheckCircle, Circle, X } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const SetlistPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [formData, setFormData] = useState({ title: '', original_artist: '', price: '', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  const loadSongsAndTags = useCallback(async () => {
    if (user) {
      setLoading(true);
      const { data: songsData, error: songsError } = await supabase.from('songs').select('*').eq('user_id', user.id).order('order');
      if (songsError) {
        toast({ title: "Error", description: "Failed to load songs.", variant: "destructive" });
      } else {
        setSongs(songsData || []);
        const uniqueTags = [...new Set(songsData.flatMap(s => s.tags || []))];
        setAllTags(uniqueTags);
      }
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadSongsAndTags();
  }, [loadSongsAndTags]);

  const capitalizeWords = (str) => str ? str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagInput = (e) => {
    const value = e.target.value;
    setTagInput(value);
    if (value.includes(',')) {
      const newTags = value.split(',').map(t => capitalizeWords(t.trim())).filter(Boolean);
      const uniqueNewTags = newTags.filter(t => !formData.tags.includes(t));
      if (uniqueNewTags.length > 0) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, ...uniqueNewTags] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
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

    const songData = { title: capitalizeWords(formData.title), original_artist: capitalizeWords(formData.original_artist), price, tags: formData.tags, user_id: user.id };
    let error;

    if (editingSong) {
      const { error: updateError } = await supabase.from('songs').update(songData).eq('id', editingSong.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('songs').insert({...songData, order: songs.length}).select().single();
      error = insertError;
    }

    if (error) {
      toast({ title: "Error saving song", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Song ${editingSong ? 'updated' : 'added'}!`, description: `Your song has been successfully ${editingSong ? 'updated' : 'added'}.` });
      loadSongsAndTags();
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const handleEdit = (song) => {
    setEditingSong(song);
    setFormData({ title: song.title, original_artist: song.original_artist, price: song.price.toString(), tags: song.tags || [] });
    setIsDialogOpen(true);
  };

  const handleDelete = async (songId) => {
    const { error } = await supabase.from('songs').delete().eq('id', songId);
    if (error) {
      toast({ title: "Error deleting song", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Song deleted", description: "The song has been removed." });
      loadSongsAndTags();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', original_artist: '', price: '', tags: [] });
    setTagInput('');
    setEditingSong(null);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(songs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSongs(items);

    const updates = items.map((song, index) => ({ id: song.id, order: index }));
    const { error } = await supabase.from('songs').upsert(updates);
    if (error) {
      toast({ title: "Error", description: "Could not save new order.", variant: "destructive" });
      loadSongsAndTags();
    } else {
      toast({ title: "Setlist order saved!" });
    }
  };

  const handleAddNewTag = () => {
    const capitalizedTag = capitalizeWords(newTag.trim());
    if (capitalizedTag && !allTags.includes(capitalizedTag)) {
      setAllTags(prev => [...prev, capitalizedTag].sort());
    }
    setNewTag('');
  };

  const hasTenSongs = songs.length >= 10;
  const hasTaggedSongs = songs.some(song => song.tags && song.tags.length > 0);

  return (
    <>
      <Helmet><title>Setlist Management - Your Song Request</title><meta name="description" content="Manage your song catalog with custom pricing." /></Helmet>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />Dashboard
                </Link>
                <span className="text-2xl font-bold neon-text">Setlist</span>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={() => {resetForm(); setIsDialogOpen(true);}}>
                    <Plus className="w-4 h-4 mr-2" />Add Song
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>{editingSong ? 'Edit Song' : 'Add New Song'}</DialogTitle>
                    <DialogDescription className="text-gray-400">{editingSong ? 'Update song details.' : 'Add a new song to your setlist.'}</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Song Title</Label>
                        <Input id="title" name="title" value={formData.title} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="Enter song title" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="original_artist">Original Artist</Label>
                        <Input id="original_artist" name="original_artist" value={formData.original_artist} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="Enter original artist" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (£)</Label>
                        <Input id="price" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="3.00" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="tags">Tags (optional, but recommended)</Label>
                          <Button type="button" variant="link" className="text-xs p-0 h-auto" onClick={() => setIsTagsDialogOpen(true)}>Edit Tags</Button>
                        </div>
                        <Input id="tags" value={tagInput} onChange={handleTagInput} className="bg-gray-800 border-gray-600" placeholder="Type tags, separated by commas" />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map(tag => (
                            <div key={tag} className="flex items-center gap-1 bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full text-sm">
                              <span>{tag}</span>
                              <button type="button" onClick={() => removeTag(tag)} className="text-blue-200 hover:text-white">
                                <X className="w-3 h-3"/>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingSong ? 'Update Song' : 'Add Song'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="glass-effect border-gray-800 mb-8">
              <CardHeader><CardTitle>Setlist Checklist</CardTitle><CardDescription>Complete these steps for a great setlist.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div className={`flex items-center ${hasTenSongs ? 'text-green-400' : 'text-gray-400'}`}>{hasTenSongs ? <CheckCircle className="w-5 h-5 mr-3"/> : <Circle className="w-5 h-5 mr-3"/>}<span>Add 10 songs. Give your audience a variety of songs/styles to request. ({songs.length}/10)</span></div>
                <div className={`flex items-center ${hasTaggedSongs ? 'text-green-400' : 'text-gray-400'}`}>{hasTaggedSongs ? <CheckCircle className="w-5 h-5 mr-3"/> : <Circle className="w-5 h-5 mr-3"/>}<span>Tag your song style/genres.</span></div>
              </CardContent>
            </Card>

            {loading ? <div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div></div> :
            songs.length === 0 ? (
              <Card className="glass-effect border-gray-800 text-center py-12"><CardContent><Music className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">No songs in your setlist</h3><p className="text-gray-400 mb-6">This is required to go live. Build your setlist by adding songs.</p><Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={() => {resetForm(); setIsDialogOpen(true);}}><Plus className="w-4 h-4 mr-2" />Add First Song</Button></CardContent></Card>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6"><div><h2 className="text-2xl font-bold text-white">Your Setlist</h2><p className="text-gray-400">{songs.length} song{songs.length !== 1 ? 's' : ''}. <span className="text-xs">Drag to re-order when displaying your set list to customers on your Live Page.</span></p></div></div>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="songs">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {songs.map((song, index) => (
                          <Draggable key={song.id} draggableId={song.id.toString()} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                <Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300">
                                  <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center flex-1">
                                        <GripVertical className="w-5 h-5 text-gray-500 mr-4 cursor-grab" />
                                        <div className="flex-1">
                                          <h3 className="text-lg font-semibold text-white mb-1">{song.title}</h3>
                                          <p className="text-gray-400 mb-2">by {song.original_artist}</p>
                                          <div className="flex items-center text-green-400 font-semibold">£{Number(song.price).toFixed(2)}</div>
                                          {song.tags && song.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{song.tags.map(tag => <span key={tag} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">{tag}</span>)}</div>}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button size="sm" variant="outline" onClick={() => handleEdit(song)} className="border-gray-600 text-gray-300 hover:bg-gray-800"><Edit className="w-4 h-4" /></Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDelete(song.id)} className="border-red-600 text-red-400 hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}
          </motion.div>
        </main>
        <Dialog open={isTagsDialogOpen} onOpenChange={setIsTagsDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader><DialogTitle>Manage Tags</DialogTitle><DialogDescription>Add or remove tags available for your songs.</DialogDescription></DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex gap-2">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag name" className="bg-gray-800 border-gray-600" />
                <Button onClick={handleAddNewTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <div key={tag} className="flex items-center gap-1 bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full text-sm">
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter><Button onClick={() => setIsTagsDialogOpen(false)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default SetlistPage;
