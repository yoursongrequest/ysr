
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
  const [formData, setFormData] = useState({ 
    artist_name: '', bio: '', profile_picture_url: '', url_slug: '',
    social_facebook: '', social_x: '', social_instagram: '', social_tiktok: '' 
  });
  const [slugError, setSlugError] = useState('');
  const [confirmSlugOpen, setConfirmSlugOpen] = useState(false);
  const qrCodeRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setFormData({ 
        artist_name: profile.artist_name || '', 
        bio: profile.bio || '', 
        profile_picture_url: profile.profile_picture_url || '', 
        url_slug: profile.url_slug || '',
        social_facebook: profile.social_facebook || '',
        social_x: profile.social_x || '',
        social_instagram: profile.social_instagram || '',
        social_tiktok: profile.social_tiktok || '',
      });
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!profile.url_slug && formData.url_slug) {
        setConfirmSlugOpen(true);
    } else {
        saveProfile();
    }
  }

  const saveProfile = async () => {
    setConfirmSlugOpen(false);
    setLoading(true);
    setSlugError('');

    if(!formData.url_slug) {
        setSlugError('Custom URL cannot be empty.');
        toast({ title: "Error", description: "Custom URL is required.", variant: "destructive" });
        setLoading(false);
        return;
    }

    const { data, error } = await supabase.from('profiles').update({ 
        artist_name: formData.artist_name, 
        bio: formData.bio, 
        profile_picture_url: formData.profile_picture_url, 
        url_slug: formData.url_slug, 
        updated_at: new Date(),
        social_facebook: formData.social_facebook,
        social_x: formData.social_x,
        social_instagram: formData.social_instagram,
        social_tiktok: formData.social_tiktok,
    }).eq('id', user.id).select().single();

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

  const SocialInput = ({ platform, handle, ...props }) => {
    const platformData = {
        facebook: { name: 'Facebook', url: 'facebook.com/' },
        x: { name: 'X (Twitter)', url: 'x.com/' },
        instagram: { name: 'Instagram', url: 'instagram.com/' },
        tiktok: { name: 'TikTok', url: 'tiktok.com/@' },
    }
    return (
        <div className="space-y-2">
            <Label htmlFor={platform} className="text-white">{platformData[platform].name}</Label>
            <div className="flex items-center">
                <span className="text-gray-400 bg-gray-800 px-3 py-2 rounded-l-md border border-r-0 border-gray-700 whitespace-nowrap">{platformData[platform].url}</span>
                <Input id={platform} name={handle} {...props} className="bg-gray-900 border-gray-700 text-white rounded-l-none" placeholder="yourhandle" />
            </div>
        </div>
    )
  }

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
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="space-y-2"><Label htmlFor="artist_name" className="text-white">Artist Name</Label><Input id="artist_name" name="artist_name" type="text" value={formData.artist_name} onChange={handleInputChange} required className="bg-gray-900 border-gray-700 text-white" placeholder="Your stage name" /></div>
                  <div className="space-y-2"><Label htmlFor="url_slug" className="text-white">Custom Page URL</Label><div className="flex items-center"><span className="text-gray-400 bg-gray-800 px-3 py-2 rounded-l-md border border-r-0 border-gray-700">yoursongrequest.com/</span><Input id="url_slug" name="url_slug" type="text" value={formData.url_slug} onChange={handleSlugChange} required disabled={!!profile?.url_slug} className="bg-gray-900 border-gray-700 text-white rounded-l-none disabled:opacity-70" placeholder="your-artist-name" /></div>{slugError && <p className="text-sm text-red-500 flex items-center mt-2"><AlertCircle className="w-4 h-4 mr-1"/>{slugError}</p>}<p className="text-sm text-gray-500">This is required to go live. Only lowercase letters, numbers, and hyphens are allowed. <span className="font-bold text-yellow-400">This cannot be changed once set.</span></p></div>
                  <div className="space-y-2"><Label htmlFor="bio" className="text-white">Bio</Label><Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} className="bg-gray-900 border-gray-700 text-white min-h-[120px]" placeholder="Tell your audience about yourself..." /></div>
                  <div className="space-y-2"><Label htmlFor="profile_picture_url" className="text-white">Profile Picture URL</Label><Input id="profile_picture_url" name="profile_picture_url" type="url" value={formData.profile_picture_url} onChange={handleInputChange} className="bg-gray-900 border-gray-700 text-white" placeholder="https://example.com/your-photo.jpg" /><p className="text-sm text-gray-500">Enter a URL to your profile picture.</p></div>

                  <Card className="glass-effect border-gray-800"><CardHeader><CardTitle>Social Media Links</CardTitle><CardDescription>Enter your handles to display social links on your page.</CardDescription></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SocialInput platform="facebook" handle="social_facebook" value={formData.social_facebook} onChange={handleInputChange} />
                    <SocialInput platform="x" handle="social_x" value={formData.social_x} onChange={handleInputChange} />
                    <SocialInput platform="instagram" handle="social_instagram" value={formData.social_instagram} onChange={handleInputChange} />
                    <SocialInput platform="tiktok" handle="social_tiktok" value={formData.social_tiktok} onChange={handleInputChange} />
                  </CardContent></Card>
                  
                  <div className="flex justify-end"><Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 neon-glow"><Save className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save Changes'}</Button></div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>

       <Dialog open={confirmSlugOpen} onOpenChange={setConfirmSlugOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-yellow-400"><AlertCircle className="mr-2"/>Confirm Your Custom URL</DialogTitle>
                    <DialogDescription>
                        You are setting your URL to: <br/>
                        <code className="font-mono bg-gray-800 p-1 rounded">yoursongrequest.com/{formData.url_slug}</code>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center">
                    <p className="font-bold text-lg text-red-500">This cannot be changed later!</p>
                    <p className="text-gray-400">This is permanent and will be linked to your QR code.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmSlugOpen(false)}>Cancel</Button>
                    <Button onClick={saveProfile} className="bg-red-600 hover:bg-red-700">I Understand, Confirm URL</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
};

export default ProfilePage;
