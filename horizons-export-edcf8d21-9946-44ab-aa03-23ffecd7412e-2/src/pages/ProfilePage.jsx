import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, User, Save } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const ProfilePage = () => {
  const { user, profile, updateProfileData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    artist_name: '',
    bio: '',
    profile_picture_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        artist_name: profile.artist_name || '',
        bio: profile.bio || '',
        profile_picture_url: profile.profile_picture_url || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        artist_name: formData.artist_name,
        bio: formData.bio,
        profile_picture_url: formData.profile_picture_url,
        updated_at: new Date()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      updateProfileData(data);
      toast({ title: "Profile updated!", description: "Your profile has been successfully updated." });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Profile Management - Your Song Request</title>
        <meta name="description" content="Update your artist profile including name, bio, and profile picture." />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center py-4"><Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Link><span className="text-2xl font-bold neon-text">Profile Management</span></div></div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="glass-effect border-gray-800">
              <CardHeader><div className="flex items-center space-x-3"><User className="w-8 h-8 text-blue-500" /><div><CardTitle className="text-2xl text-white">Artist Profile</CardTitle><CardDescription className="text-gray-400">Update your public profile information</CardDescription></div></div></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2"><Label htmlFor="artist_name" className="text-white">Artist Name</Label><Input id="artist_name" name="artist_name" type="text" value={formData.artist_name} onChange={handleInputChange} required className="bg-gray-900 border-gray-700 text-white" placeholder="Your stage name" /></div>
                  <div className="space-y-2"><Label htmlFor="bio" className="text-white">Bio</Label><Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} className="bg-gray-900 border-gray-700 text-white min-h-[120px]" placeholder="Tell your audience about yourself..." /></div>
                  <div className="space-y-2"><Label htmlFor="profile_picture_url" className="text-white">Profile Picture URL</Label><Input id="profile_picture_url" name="profile_picture_url" type="url" value={formData.profile_picture_url} onChange={handleInputChange} className="bg-gray-900 border-gray-700 text-white" placeholder="https://example.com/your-photo.jpg" /><p className="text-sm text-gray-500">Enter a URL to your profile picture.</p></div>

                  <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
                    <h3 className="text-lg font-semibold mb-4 text-white">Profile Preview</h3>
                    <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {formData.profile_picture_url ? <img src={formData.profile_picture_url} alt="Profile Preview" className="w-16 h-16 rounded-full object-cover" /> : <span>{formData.artist_name ? formData.artist_name.charAt(0).toUpperCase() : '?'}</span>}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-white">{formData.artist_name || 'Your Artist Name'}</h4>
                            <p className="text-gray-400 mt-2">{formData.bio || 'Your bio will appear here...'}</p>
                        </div>
                    </div>
                  </div>

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