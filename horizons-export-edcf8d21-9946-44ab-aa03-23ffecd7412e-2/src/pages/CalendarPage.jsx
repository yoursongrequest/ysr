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
import { ArrowLeft, Calendar, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const CalendarPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [formData, setFormData] = useState({ date: '', venue_name: '', time: '' });

  const loadGigs = useCallback(async () => {
    if (user) {
      setLoading(true);
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        toast({ title: "Error loading gigs", description: error.message, variant: "destructive" });
      } else {
        setGigs(data);
      }
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadGigs();
  }, [loadGigs]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.venue_name || !formData.time) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    const gigData = { ...formData, user_id: user.id };
    let error;

    if (editingGig) {
      const { error: updateError } = await supabase.from('gigs').update(gigData).eq('id', editingGig.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('gigs').insert(gigData);
      error = insertError;
    }

    if (error) {
      toast({ title: "Error saving gig", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Gig ${editingGig ? 'updated' : 'added'}!`, description: `Your performance has been successfully ${editingGig ? 'updated' : 'added'}.` });
      loadGigs();
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const handleEdit = (gig) => {
    setEditingGig(gig);
    setFormData({ date: gig.date, venue_name: gig.venue_name, time: gig.time });
    setIsDialogOpen(true);
  };

  const handleDelete = async (gigId) => {
    const { error } = await supabase.from('gigs').delete().eq('id', gigId);
    if (error) {
      toast({ title: "Error deleting gig", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Gig deleted", description: "The performance has been removed." });
      loadGigs();
    }
  };

  const resetForm = () => {
    setFormData({ date: '', venue_name: '', time: '' });
    setEditingGig(null);
  };

  const handleDialogClose = () => {
    resetForm();
    setIsDialogOpen(false);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isUpcoming = (dateString) => {
    const gigDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return gigDate >= today;
  };

  const upcomingGigs = gigs.filter(gig => isUpcoming(gig.date)).sort((a,b) => new Date(a.date) - new Date(b.date));
  const pastGigs = gigs.filter(gig => !isUpcoming(gig.date)).sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <Helmet>
        <title>Calendar Management - Your Song Request</title>
        <meta name="description" content="Schedule and manage your upcoming performances and gigs." />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <span className="text-2xl font-bold neon-text">Calendar</span>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={resetForm}><Plus className="w-4 h-4 mr-2" />Add Gig</Button></DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader><DialogTitle>{editingGig ? 'Edit Gig' : 'Add New Gig'}</DialogTitle><DialogDescription className="text-gray-400">{editingGig ? 'Update the performance details.' : 'Add a new performance to your calendar.'}</DialogDescription></DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} className="bg-gray-800 border-gray-600" /></div>
                      <div className="space-y-2"><Label htmlFor="venue_name">Venue Name</Label><Input id="venue_name" name="venue_name" value={formData.venue_name} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="Enter venue name" /></div>
                      <div className="space-y-2"><Label htmlFor="time">Time</Label><Input id="time" name="time" type="time" value={formData.time} onChange={handleInputChange} className="bg-gray-800 border-gray-600" /></div>
                    </div>
                    <DialogFooter><Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingGig ? 'Update Gig' : 'Add Gig'}</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {loading ? <div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div></div> :
            gigs.length === 0 ? (
              <Card className="glass-effect border-gray-800 text-center py-12">
                <CardContent>
                  <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">No gigs scheduled</h3><p className="text-gray-400 mb-6">Start by adding your first performance.</p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={resetForm}><Plus className="w-4 h-4 mr-2" />Add First Gig</Button></DialogTrigger></Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {upcomingGigs.length > 0 && <div><h2 className="text-2xl font-bold text-white mb-6">Upcoming</h2><div className="grid gap-4">{upcomingGigs.map((gig, i) => (<GigCard key={gig.id} gig={gig} i={i} handleEdit={handleEdit} handleDelete={handleDelete} formatDate={formatDate} isUpcoming={true}/>))}</div></div>}
                {pastGigs.length > 0 && <div><h2 className="text-2xl font-bold text-white mb-6">Past</h2><div className="grid gap-4">{pastGigs.map((gig, i) => (<GigCard key={gig.id} gig={gig} i={i} handleEdit={handleEdit} handleDelete={handleDelete} formatDate={formatDate} isUpcoming={false}/>))}</div></div>}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
};

const GigCard = ({ gig, i, handleEdit, handleDelete, formatDate, isUpcoming }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
        <Card className={`glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300 ${isUpcoming ? 'border-l-4 border-l-blue-500' : 'opacity-75'}`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{gig.venue_name}</h3>
                        <div className="flex items-center text-gray-400 mb-1"><Calendar className="w-4 h-4 mr-2" /><span>{formatDate(gig.date)}</span></div>
                        <div className="flex items-center text-gray-400"><Clock className="w-4 h-4 mr-2" /><span>{gig.time}</span></div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(gig)} className="border-gray-600 text-gray-300 hover:bg-gray-800"><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(gig.id)} className="border-red-600 text-red-400 hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </motion.div>
)

export default CalendarPage;