
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
import { ArrowLeft, Calendar, Plus, Edit, Trash2, MapPin, Clock } from 'lucide-react';

const CalendarPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gigs, setGigs] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    venueName: '',
    time: ''
  });

  useEffect(() => {
    loadGigs();
  }, [user]);

  const loadGigs = () => {
    if (user) {
      const savedGigs = JSON.parse(localStorage.getItem(`ysr_gigs_${user.id}`) || '[]');
      // Sort gigs by date
      const sortedGigs = savedGigs.sort((a, b) => new Date(a.date) - new Date(b.date));
      setGigs(sortedGigs);
    }
  };

  const saveGigs = (updatedGigs) => {
    if (user) {
      const sortedGigs = updatedGigs.sort((a, b) => new Date(a.date) - new Date(b.date));
      localStorage.setItem(`ysr_gigs_${user.id}`, JSON.stringify(sortedGigs));
      setGigs(sortedGigs);
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
    
    if (!formData.date || !formData.venueName || !formData.time) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const gigData = {
      id: editingGig ? editingGig.id : Date.now().toString(),
      date: formData.date,
      venueName: formData.venueName,
      time: formData.time,
      createdAt: editingGig ? editingGig.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedGigs;
    if (editingGig) {
      updatedGigs = gigs.map(gig => gig.id === editingGig.id ? gigData : gig);
      toast({
        title: "Gig updated!",
        description: "Your performance has been successfully updated.",
      });
    } else {
      updatedGigs = [...gigs, gigData];
      toast({
        title: "Gig added!",
        description: "Your performance has been added to the calendar.",
      });
    }

    saveGigs(updatedGigs);
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (gig) => {
    setEditingGig(gig);
    setFormData({
      date: gig.date,
      venueName: gig.venueName,
      time: gig.time
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (gigId) => {
    const updatedGigs = gigs.filter(gig => gig.id !== gigId);
    saveGigs(updatedGigs);
    toast({
      title: "Gig deleted",
      description: "The performance has been removed from your calendar.",
    });
  };

  const resetForm = () => {
    setFormData({
      date: '',
      venueName: '',
      time: ''
    });
    setEditingGig(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (dateString) => {
    const gigDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return gigDate >= today;
  };

  const upcomingGigs = gigs.filter(gig => isUpcoming(gig.date));
  const pastGigs = gigs.filter(gig => !isUpcoming(gig.date));

  return (
    <>
      <Helmet>
        <title>Calendar Management - Your Song Request</title>
        <meta name="description" content="Schedule and manage your upcoming performances and gigs." />
        <meta property="og:title" content="Calendar Management - Your Song Request" />
        <meta property="og:description" content="Schedule and manage your upcoming performances and gigs." />
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
                <span className="text-2xl font-bold neon-text">Calendar Management</span>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Gig
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>{editingGig ? 'Edit Gig' : 'Add New Gig'}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingGig ? 'Update the performance details below.' : 'Add a new performance to your calendar.'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="bg-gray-800 border-gray-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venueName">Venue Name</Label>
                        <Input
                          id="venueName"
                          name="venueName"
                          value={formData.venueName}
                          onChange={handleInputChange}
                          className="bg-gray-800 border-gray-600"
                          placeholder="Enter venue name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          name="time"
                          type="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          className="bg-gray-800 border-gray-600"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingGig ? 'Update Gig' : 'Add Gig'}
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
            {gigs.length === 0 ? (
              <Card className="glass-effect border-gray-800 text-center py-12">
                <CardContent>
                  <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No gigs scheduled yet</h3>
                  <p className="text-gray-400 mb-6">Start organizing your performances by adding your first gig</p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white neon-glow" onClick={resetForm}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Gig
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Upcoming Gigs */}
                {upcomingGigs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Upcoming Performances</h2>
                    <div className="grid gap-4">
                      {upcomingGigs.map((gig, index) => (
                        <motion.div
                          key={gig.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300 border-l-4 border-l-blue-500">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-white mb-2">{gig.venueName}</h3>
                                  <div className="flex items-center text-gray-400 mb-1">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>{formatDate(gig.date)}</span>
                                  </div>
                                  <div className="flex items-center text-gray-400">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <span>{gig.time}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(gig)}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(gig.id)}
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

                {/* Past Gigs */}
                {pastGigs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Past Performances</h2>
                    <div className="grid gap-4">
                      {pastGigs.map((gig, index) => (
                        <motion.div
                          key={gig.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <Card className="glass-effect border-gray-800 hover:border-gray-700 transition-all duration-300 opacity-75">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-white mb-2">{gig.venueName}</h3>
                                  <div className="flex items-center text-gray-400 mb-1">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>{formatDate(gig.date)}</span>
                                  </div>
                                  <div className="flex items-center text-gray-400">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <span>{gig.time}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(gig)}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(gig.id)}
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
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default CalendarPage;
