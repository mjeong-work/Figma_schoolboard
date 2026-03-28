import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './authContext';
import { supabase } from './supabaseClient';

export interface Comment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  date: string;
}

export interface Post {
  id: string;
  title: string;
  date: string;
  author: string;
  authorId: string;
  verified: boolean;
  content: string;
  image: string | null;
  likes: string[];
  comments: Comment[];
  category: 'current-students' | 'alumni' | 'all-school';
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  participants: string[];
  description: string;
  image: string;
  likes: string[];
  comments: Comment[];
  author: string;
  authorId: string;
  category?: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  category: string;
  price: number;
  condition: string;
  description: string;
  image: string;
  seller: {
    name: string;
    contact: string;
    verified: boolean;
    id: string;
  };
  postedDate: string;
  views: number;
  savedBy: string[];
}

interface DataContextType {
  posts: Post[];
  events: Event[];
  marketplaceItems: MarketplaceItem[];
  addPost: (post: Omit<Post, 'id' | 'date' | 'likes' | 'comments' | 'authorId' | 'author' | 'verified'>) => void;
  deletePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  addCommentToPost: (postId: string, text: string) => void;
  deleteCommentFromPost: (postId: string, commentId: string) => void;
  isPostLiked: (postId: string) => boolean;
  addEvent: (event: Omit<Event, 'id' | 'likes' | 'comments' | 'participants' | 'authorId' | 'author'>) => void;
  deleteEvent: (eventId: string) => void;
  toggleLikeEvent: (eventId: string) => void;
  addCommentToEvent: (eventId: string, text: string) => void;
  toggleRSVPEvent: (eventId: string) => void;
  isEventLiked: (eventId: string) => boolean;
  hasRSVPed: (eventId: string) => boolean;
  addMarketplaceItem: (item: Omit<MarketplaceItem, 'id' | 'postedDate' | 'views' | 'savedBy' | 'seller'> & { seller: Omit<MarketplaceItem['seller'], 'id'> }) => void;
  deleteMarketplaceItem: (itemId: string) => void;
  toggleSaveItem: (itemId: string) => void;
  incrementItemViews: (itemId: string) => void;
  isItemSaved: (itemId: string) => boolean;
  getUserPosts: () => Post[];
  getUserEvents: () => Event[];
  getUserMarketplaceItems: () => MarketplaceItem[];
  getUserSavedItems: () => MarketplaceItem[];
  getUserStats: () => { posts: number; eventsAttended: number; itemsSold: number; savedItems: number };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);

  // Fetch posts from Supabase
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_author_id_fkey (name, verified),
        post_likes (user_id),
        post_comments (id, text, created_at, profiles!post_comments_author_id_fkey (name, id))
      `)
      .order('created_at', { ascending: false });

    console.log('Posts data:', data);
    console.log('Posts error:', error);

    if (error) { console.error(error); return; }

    const formatted: Post[] = (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      image: p.image_url,
      category: p.category,
      author: p.profiles?.name || 'Anonymous',
      authorId: p.author_id,
      verified: p.profiles?.verified || false,
      date: p.created_at?.split('T')[0],
      likes: (p.post_likes || []).map((l: any) => l.user_id),
      comments: (p.post_comments || []).map((c: any) => ({
        id: c.id,
        text: c.text,
        author: c.profiles?.name || 'Anonymous',
        authorId: c.profiles?.id || '',
        date: c.created_at?.split('T')[0],
      })),
    }));

    setPosts(formatted);
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  // Posts
  const addPost = async (postData: Omit<Post, 'id' | 'date' | 'likes' | 'comments' | 'authorId' | 'author' | 'verified'>) => {
    if (!user) return;
    const { error } = await supabase.from('posts').insert({
      title: postData.title,
      content: postData.content,
      image_url: postData.image,
      category: postData.category,
      author_id: user.id,
    });
    if (!error) fetchPosts();
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchPosts();
  };

  const toggleLikePost = async (postId: string) => {
    if (!user) return;
    const liked = isPostLiked(postId);
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    }
    fetchPosts();
  };

  const addCommentToPost = async (postId: string, text: string) => {
    if (!user || !text.trim()) return;
    await supabase.from('post_comments').insert({
      post_id: postId,
      author_id: user.id,
      text: text.trim(),
    });
    fetchPosts();
  };

  const deleteCommentFromPost = async (postId: string, commentId: string) => {
    if (!user) return;
    await supabase.from('post_comments').delete().eq('id', commentId);
    fetchPosts();
  };

  const isPostLiked = (postId: string): boolean => {
    if (!user) return false;
    const post = posts.find(p => p.id === postId);
    return post ? post.likes.includes(user.id) : false;
  };

  // Events (still local for now)
  const addEvent = (eventData: Omit<Event, 'id' | 'likes' | 'comments' | 'participants' | 'authorId' | 'author'>) => {
    if (!user) return;
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
      author: user.name,
      authorId: user.id,
      participants: [],
      likes: [],
      comments: [],
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const toggleLikeEvent = (eventId: string) => {
    if (!user) return;
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const likes = event.likes.includes(user.id)
          ? event.likes.filter(id => id !== user.id)
          : [...event.likes, user.id];
        return { ...event, likes };
      }
      return event;
    }));
  };

  const addCommentToEvent = (eventId: string, text: string) => {
    if (!user || !text.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: user.name,
      authorId: user.id,
      text: text.trim(),
      date: new Date().toISOString().split('T')[0],
    };
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return { ...event, comments: [...event.comments, newComment] };
      }
      return event;
    }));
  };

  const toggleRSVPEvent = (eventId: string) => {
    if (!user) return;
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const participants = event.participants.includes(user.id)
          ? event.participants.filter(id => id !== user.id)
          : [...event.participants, user.id];
        return { ...event, participants };
      }
      return event;
    }));
  };

  const isEventLiked = (eventId: string): boolean => {
    if (!user) return false;
    const event = events.find(e => e.id === eventId);
    return event ? event.likes.includes(user.id) : false;
  };

  const hasRSVPed = (eventId: string): boolean => {
    if (!user) return false;
    const event = events.find(e => e.id === eventId);
    return event ? event.participants.includes(user.id) : false;
  };

  // Marketplace (still local for now)
  const addMarketplaceItem = (itemData: any) => {
    if (!user) return;
    const newItem: MarketplaceItem = {
      ...itemData,
      id: Date.now().toString(),
      postedDate: new Date().toISOString().split('T')[0],
      views: 0,
      savedBy: [],
      seller: { ...itemData.seller, id: user.id },
    };
    setMarketplaceItems(prev => [newItem, ...prev]);
  };

  const deleteMarketplaceItem = (itemId: string) => {
    setMarketplaceItems(prev => prev.filter(item => item.id !== itemId));
  };

  const toggleSaveItem = (itemId: string) => {
    if (!user) return;
    setMarketplaceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const savedBy = item.savedBy.includes(user.id)
          ? item.savedBy.filter(id => id !== user.id)
          : [...item.savedBy, user.id];
        return { ...item, savedBy };
      }
      return item;
    }));
  };

  const incrementItemViews = (itemId: string) => {
    setMarketplaceItems(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, views: item.views + 1 };
      return item;
    }));
  };

  const isItemSaved = (itemId: string): boolean => {
    if (!user) return false;
    const item = marketplaceItems.find(i => i.id === itemId);
    return item ? item.savedBy.includes(user.id) : false;
  };

  const getUserPosts = () => user ? posts.filter(p => p.authorId === user.id) : [];
  const getUserEvents = () => user ? events.filter(e => e.participants.includes(user.id)) : [];
  const getUserMarketplaceItems = () => user ? marketplaceItems.filter(item => item.seller.id === user.id) : [];
  const getUserSavedItems = () => user ? marketplaceItems.filter(item => item.savedBy.includes(user.id)) : [];
  const getUserStats = () => ({
    posts: getUserPosts().length,
    eventsAttended: getUserEvents().length,
    itemsSold: getUserMarketplaceItems().length,
    savedItems: getUserSavedItems().length,
  });

  return (
    <DataContext.Provider value={{
      posts, events, marketplaceItems,
      addPost, deletePost, toggleLikePost, addCommentToPost, deleteCommentFromPost, isPostLiked,
      addEvent, deleteEvent, toggleLikeEvent, addCommentToEvent, toggleRSVPEvent, isEventLiked, hasRSVPed,
      addMarketplaceItem, deleteMarketplaceItem, toggleSaveItem, incrementItemViews, isItemSaved,
      getUserPosts, getUserEvents, getUserMarketplaceItems, getUserSavedItems, getUserStats,
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