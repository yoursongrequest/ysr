
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Calendar, Plus, Edit, Trash2, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const CalendarPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [formData, setFormData] = useState({ date: '', venue_name: '', time: '', address: '', postcode: '', show_map: true });

  const loadGigs = useCallback(async () => {
    if (user) {
      setLoading(true);
      const { data, error } = await supabase.from('gigs').select('*, lat, lon, show_map').eq('user_id', user.id).order('date', { ascending: false });
      if (error) { toast({ title: "Error loading gigs", description: error.message, variant: "destructive" }); } 
      else { setGigs(data); }
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { loadGigs(); }, [loadGigs]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.venue_name || !formData.time) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    let gigData = { ...formData, user_id: user.id };

    if (formData.postcode || formData.address) {
        try {
            const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode', { body: { address: formData.address, postcode: formData.postcode } });
            if (geoError || !geoData.lat) {
                toast({ title: "Geocoding Warning", description: "Could not find coordinates. The map won't be displayed for this address.", variant: "default" });
                gigData.lat = null;
                gigData.lon = null;
            } else {
                gigData.lat = geoData.lat;
                gigData.lon = geoData.lon;
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to geocode address.", variant: "destructive" });
            return;
        }
    } else {
        gigData.lat = null;
        gigData.lon = null;
    }

    let error;
    if (editingGig) { ({ error } = await supabase.from('gigs').update(gigData).eq('id', editingGig.id)); } 
    else { ({ error } = await supabase.from('gigs').insert(gigData)); }

    if (error) { toast({ title: "Error saving gig", description: error.message, variant: "destructive" }); } 
    else { toast({ title: `Gig ${editingGig ? 'updated' : 'added'}!`, description: `Your performance has been successfully ${editingGig ? 'updated' : 'added'}.` }); loadGigs(); resetForm(); setIsDialogOpen(false); }
  };

  const handleEdit = (gig) => {
    setEditingGig(gig);
    setFormData({ date: gig.date, venue_name: gig.venue_name, time: gig.time, address: gig.address || '', postcode: gig.postcode || '', show_map: gig.show_map ?? true });
    setIsDialogOpen(true);
  };

  const handleDelete = async (gigId) => {
    const { error } = await supabase.from('gigs').delete().eq('id', gigId);
    if (error) { toast({ title: "Error deleting gig", description: error.message, variant: "destructive" }); } 
    else { toast({ title: "Gig deleted", description: "The performance has been removed." }); loadGigs(); }
  };

  const resetForm = () => { setFormData({ date: '', venue_name: '', time: '', address: '', postcode: '', show_map: true }); setEditingGig(null); };
  const handleDialogClose = () => { resetForm(); setIsDialogOpen(false); };
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isUpcoming = (dateString) => new Date(`${dateString}T00:00:00Z`) >= new Date(new Date().setUTCHours(0, 0, 0, 0));
  
  const upcomingGigs = gigs.filter(gig => isUpcoming(gig.date)).sort((a,b) => new Date(a.date) - new Date(b.date));
  const pastGigs = gigs.filter(gig => !isUpcoming(gig.date)).sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <Helmet><title>Calendar Management - Your Song Request</title><meta name="description" content="Schedule and manage your upcoming performances and gigs." /></Helmet>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center"><Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Link><span className="text-2xl font-bold neon-text">Calendar</span></div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={resetForm}><Plus className="w-4 h-4 mr-2" />Add Gig</Button></DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader><DialogTitle>{editingGig ? 'Edit Gig' : 'Add New Gig'}</DialogTitle><DialogDescription className="text-gray-400">{editingGig ? 'Update the performance details.' : 'Add a new performance to your calendar.'}</DialogDescription></DialogHeader>
                  <form onSubmit={handleSubmit}><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="DD/MM/YYYY" /></div><div className="space-y-2"><Label htmlFor="venue_name">Venue Name</Label><Input id="venue_name" name="venue_name" value={formData.venue_name} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="Enter venue name" /></div><div className="space-y-2"><Label htmlFor="time">Time</Label><Input id="time" name="time" type="time" value={formData.time} onChange={handleInputChange} className="bg-gray-800 border-gray-600" /></div><div className="space-y-2"><Label htmlFor="address">Address (optional)</Label><Input id="address" name="address" value={formData.address} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="e.g., 123 Music Lane, London" /></div><div className="space-y-2"><Label htmlFor="postcode">Post Code (optional, for map pin)</Label><Input id="postcode" name="postcode" value={formData.postcode} onChange={handleInputChange} className="bg-gray-800 border-gray-600" placeholder="e.g., SW1A 0AA" /></div><div className="flex items-center space-x-2"><Switch id="show_map" name="show_map" checked={formData.show_map} onCheckedChange={(checked) => setFormData(prev => ({...prev, show_map: checked}))} /><Label htmlFor="show_map">Show map on public page</Label></div></div><DialogFooter><Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingGig ? 'Update Gig' : 'Add Gig'}</Button></DialogFooter></form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {loading ? <div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div></div> : gigs.length === 0 ? <Card className="glass-effect border-gray-800 text-center py-12"><CardContent><Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">No gigs scheduled</h3><p className="text-gray-400 mb-6">Start by adding your first performance.</p><Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={resetForm}><Plus className="w-4 h-4 mr-2" />Add First Gig</Button></DialogTrigger></Dialog></CardContent></Card> : <div className="space-y-8">{upcomingGigs.length > 0 && <div><h2 className="text-2xl font-bold text-white mb-6">Upcoming</h2><div className="grid gap-4">{upcomingGigs.map((gig, i) => (<GigCard key={gig.id} gig={gig} i={i} handleEdit={handleEdit} handleDelete={handleDelete} formatDate={formatDate} isUpcoming={true}/>))}</div></div>}{pastGigs.length > 0 && <div><h2 className="text-2xl font-bold text-white mb-6">Past</h2><div className="grid gap-4">{pastGigs.map((gig, i) => (<GigCard key={gig.id} gig={gig} i={i} handleEdit={handleEdit} handleDelete={handleDelete} formatDate={formatDate} isUpcoming={false}/>))}</div></div>}</div>}
          </motion.div>
        </main>
      </div>
    </>
  );
};

const GigCard = ({ gig, i, handleEdit, handleDelete, formatDate, isUpcoming }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
        <Card className={`glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300 ${isUpcoming ? 'border-l-4 border-l-blue-500' : 'opacity-75'}`}><CardContent className="p-6"><div className="flex items-start justify-between"><div className="flex-1"><h3 className="text-lg font-semibold text-white mb-2">{gig.venue_name}</h3><div className="flex items-center text-gray-400 mb-1"><Calendar className="w-4 h-4 mr-2" /><span>{formatDate(gig.date)}</span></div><div className="flex items-center text-gray-400 mb-2"><Clock className="w-4 h-4 mr-2" /><span>{new Date(`1970-01-01T${gig.time}Z`).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})}</span></div>{gig.address && <div className="flex items-start text-gray-400"><MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" /><span>{`${gig.address}${gig.postcode ? ', ' + gig.postcode : ''}`}</span></div>}</div><div className="flex items-center space-x-2 flex-shrink-0"><Button size="sm" variant="outline" onClick={() => handleEdit(gig)} className="border-gray-600 text-gray-300 hover:bg-gray-800"><Edit className="w-4 h-4" /></Button><Button size="sm" variant="outline" onClick={() => handleDelete(gig.id)} className="border-red-600 text-red-400 hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></Button></div></div></CardContent></Card>
    </motion.div>
)

export default CalendarPage;