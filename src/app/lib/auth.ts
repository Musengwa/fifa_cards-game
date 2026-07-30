import { supabase, API_BASE_URL } from './supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicUrl: string | null;
}

export const signUp = async (email: string, password: string, name: string) => {
  try {
    console.log('Starting signup process...', { email, name });

    const { publicAnonKey } = await import('/utils/supabase/info');

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, name }),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse signup response:', parseError);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    console.log('Signup response:', { ok: response.ok, status: response.status, data });

    if (!response.ok) {
      const errorMsg = data.error || data.message || JSON.stringify(data) || 'Signup failed';
      console.error('Signup failed with error:', errorMsg);
      throw new Error(errorMsg);
    }

    // Check if server returned a session (new flow)
    if (data.access_token && data.user) {
      console.log('Server returned session, storing tokens...');
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_id', data.user.id);
      console.log('Stored auth tokens for user:', data.user.id);
      return data;
    }

    // Fallback: if server didn't return session, try signing in (old flow)
    if (data.warning) {
      console.warn('Server warning:', data.warning);
    }

    console.log('No session from server, attempting to sign in...');

    const { data: sessionData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Sign in response after signup:', {
      hasSession: !!sessionData?.session,
      hasUser: !!sessionData?.user,
      error: error ? {
        message: error.message,
        status: error.status,
        name: error.name
      } : null
    });

    if (error) {
      console.error('Sign in error after signup:', error);
      throw new Error(`Sign in failed after signup: ${error.message}. Please try signing in manually.`);
    }

    // Store access token
    if (sessionData.session?.access_token) {
      localStorage.setItem('access_token', sessionData.session.access_token);
      localStorage.setItem('user_id', sessionData.user.id);
      console.log('Stored auth tokens for user:', sessionData.user.id);
    } else {
      console.error('No session returned from sign in');
      throw new Error('No session created after signup. Please try signing in manually.');
    }

    return sessionData;
  } catch (error: any) {
    console.error('Signup error:', error);
    throw new Error(error.message || 'Signup failed');
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('Starting sign in...', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Sign in response:', { data, error });

    if (error) throw error;

    // Store access token
    if (data.session?.access_token) {
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('user_id', data.user.id);
      console.log('Stored auth tokens, user ID:', data.user.id);
    }

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_id');
};

export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session error:', error);
      return null;
    }

    // Update stored token if available
    if (data.session?.access_token) {
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('user_id', data.session.user.id);
    }

    return data.session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const getCurrentUserId = () => {
  return localStorage.getItem('user_id');
};