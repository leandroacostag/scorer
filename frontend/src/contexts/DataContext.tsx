import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getFriendsList, 
  getReceivedRequests, 
  getSentRequests, 
  getUserMatches,
  setAuthTokenGetter 
} from '@/services';
import { User, Match } from '@/types';

interface DataContextType {
  friends: User[];
  receivedRequests: User[];
  sentRequests: User[];
  matches: Match[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshMatches: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const { isAuthenticated } = auth;
  
  const [friends, setFriends] = useState<User[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.getAccessToken) {
      // Cast getAccessToken to ensure it never returns null
      const getToken = async () => {
        const token = await auth.getAccessToken();
        if (!token) throw new Error('No auth token available');
        return token;
      };
      setAuthTokenGetter(getToken);
    }
  }, [auth]);

  const refreshFriends = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const [friendsData, receivedData, sentData] = await Promise.all([
        getFriendsList(),
        getReceivedRequests(),
        getSentRequests()
      ]);
      setFriends(friendsData);
      setReceivedRequests(receivedData);
      setSentRequests(sentData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching friend data:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const refreshMatches = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const matchesData = await getUserMatches();
      setMatches(matchesData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching matches:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      await Promise.all([
        refreshFriends(),
        refreshMatches()
      ]);
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <DataContext.Provider value={{
      friends,
      receivedRequests,
      sentRequests,
      matches,
      loading,
      error,
      refreshData,
      refreshFriends,
      refreshMatches
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 