
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, User, Save, AlertCircle, QrCode, Download } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import QRCode from 'qrcode.react';

const ProfilePage = () => {
  const { user, profile, updateProfileData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ artist_name: '', bio: '', profile_picture_url: '', url_slug: '' });
  const [slugError, setSlugError] = useState('');
  const qrCodeRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setFormData({ artist_name: profile.artist_name || '', bio: profile.bio || '', profile_picture_url: profile.profile_picture_url || '', url_slug: profile.url_slug || '' });
    }
  }, [profile]);
  
  const handleSlugChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({...prev, url_slug: value}));
    setSlugError('');
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSlugError('');

    if(!formData.url_slug) {
        setSlugError('Custom URL cannot be empty.');
        toast({ title: "Error", description: "Custom URL is required.", variant: "destructive" });
        setLoading(false);
        return;
    }

    const { data, error } = await supabase.from('profiles').update({ artist_name: formData.artist_name, bio: formData.bio, profile_picture_url: formData.profile_picture_url, url_slug: formData.url_slug, updated_at: new Date() }).eq('id', user.id).select().single();

    if (error) {
        if (error.code === '23505') {
            setSlugError('This URL is already taken. Please choose another.');
            toast({ title: "Error", description: "This URL is already taken.", variant: "destructive" });
        } else {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        }
    } else {
      updateProfileData(data);
      toast({ title: "Profile updated!", description: "Your profile has been successfully updated." });
      navigate('/admin');
    }
    setLoading(false);
  };

  const downloadQRCode = (format) => {
    const canvas = qrCodeRef.current.querySelector('canvas');
    const link = document.createElement('a');
    link.download = `ysr-qrcode-${profile.url_slug}.${format}`;
    if (format === 'png') {
      link.href = canvas.toDataURL('image/png');
    } else {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;
      const ctx = newCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
      ctx.drawImage(canvas, 0, 0);
      link.href = newCanvas.toDataURL('image/jpeg');
    }
    link.click();
  };

  return (
    <>
      <Helmet><title>Profile Management - Your Song Request</title><meta name="description" content="Update your artist profile including name, bio, and profile picture." /></Helmet>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center py-4"><Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Link><span className="text-2xl font-bold neon-text">Profile Management</span></div></div></header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="glass-effect border-gray-800">
              <CardHeader><div className="flex items-center justify-between"><div className="flex items-center space-x-3"><User className="w-8 h-8 text-blue-500" /><div><CardTitle className="text-2xl text-white">Artist Profile</CardTitle><CardDescription className="text-gray-400">Update your public profile information</CardDescription></div></div>
              {profile?.url_slug && (
                <Dialog>
                  <DialogTrigger asChild><Button variant="outline"><QrCode className="w-4 h-4 mr-2" />View QR Code</Button></DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white">
                    <DialogHeader><DialogTitle>Your QR Code</DialogTitle><DialogDescription>Fans can scan this to go directly to your page.</DialogDescription></DialogHeader>
                    <div className="flex flex-col items-center justify-center p-4 space-y-4">
                      <div ref={qrCodeRef} className="bg-white p-4 rounded-lg"><QRCode value={`${window.location.origin}/${profile.url_slug}`} size={256} level="H" includeMargin={true} /></div>
                      <div className="flex space-x-2">
                        <Button onClick={() => downloadQRCode('png')}><Download className="w-4 h-4 mr-2" />Download PNG</Button>
                        <Button onClick={() => downloadQRCode('jpg')}><Download className="w-4 h-4 mr-2" />Download JPG</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              </div></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2"><Label htmlFor="artist_name" className="text-white">Artist Name</Label><Input id="artist_name" name="artist_name" type="text" value={formData.artist_name} onChange={handleInputChange} required className="bg-gray-900 border-gray-700 text-white" placeholder="Your stage name" /></div>
                  <div className="space-y-2"><Label htmlFor="url_slug" className="text-white">Custom Page URL</Label><div className="flex items-center"><span className="text-gray-400 bg-gray-800 px-3 py-2 rounded-l-md border border-r-0 border-gray-700">yoursongrequest.com/</span><Input id="url_slug" name="url_slug" type="text" value={formData.url_slug} onChange={handleSlugChange} required className="bg-gray-900 border-gray-700 text-white rounded-l-none" placeholder="your-artist-name" /></div>{slugError && <p className="text-sm text-red-500 flex items-center mt-2"><AlertCircle className="w-4 h-4 mr-1"/>{slugError}</p>}<p className="text-sm text-gray-500">This is required to go live. Only lowercase letters, numbers, and hyphens are allowed.</p></div>
                  <div className="space-y-2"><Label htmlFor="bio" className="text-white">Bio</Label><Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} className="bg-gray-900 border-gray-700 text-white min-h-[120px]" placeholder="Tell your audience about yourself..." /></div>
                  <div className="space-y-2"><Label htmlFor="profile_picture_url" className="text-white">Profile Picture URL</Label><Input id="profile_picture_url" name="profile_picture_url" type="url" value={formData.profile_picture_url} onChange={handleInputChange} className="bg-gray-900 border-gray-700 text-white" placeholder="https://example.com/your-photo.jpg" /><p className="text-sm text-gray-500">Enter a URL to your profile picture.</p></div>
                  <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50"><h3 className="text-lg font-semibold mb-4 text-white">Profile Preview</h3><div className="flex items-start space-x-4"><div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{formData.profile_picture_url ? <img src={formData.profile_picture_url} alt="Profile Preview" className="w-16 h-16 rounded-full object-cover" /> : <span>{formData.artist_name ? formData.artist_name.charAt(0).toUpperCase() : '?'}</span>}</div><div className="flex-1"><h4 className="text-xl font-bold text-white">{formData.artist_name || 'Your Artist Name'}</h4><p className="text-gray-400 mt-2">{formData.bio || 'Your bio will appear here...'}</p></div></div></div>
                  <div className="flex justify-end"><Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 neon-glow"><Save className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save Changes'}</Button></div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default ProfilePage;
