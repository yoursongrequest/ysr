
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error if profile is missing
      console.error('Error fetching profile:', error);
    }
    return data;
  }, []);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    if(session?.user) {
      const profileData = await fetchProfile(session.user.id);
      setProfile(profileData);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await handleSession(session);
          if (sessionStorage.getItem('isNewUser')) {
            sessionStorage.removeItem('isNewUser');
            navigate('/admin');
          }
        } else if (event === 'SIGNED_OUT') {
          await handleSession(null);
        } else {
           await handleSession(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession, navigate]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
      return { data, error };
    }
    
    // Since email confirmation is off, new user is logged in.
    // The onAuthStateChange listener will handle the redirect.
    sessionStorage.setItem('isNewUser', 'true');
    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    } else {
        toast({
            title: "Signed in successfully!",
        });
        navigate('/admin');
    }

    return { error };
  }, [toast, navigate]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    } else {
      navigate('/');
    }

    return { error };
  }, [toast, navigate]);
  
  const updateProfileData = useCallback((newProfileData) => {
    setProfile(newProfileData);
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfileData
  }), [user, profile, session, loading, signUp, signIn, signOut, updateProfileData]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
