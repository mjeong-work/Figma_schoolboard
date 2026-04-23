import { useState, useEffect } from 'react';
import { Heart, Eye, BadgeCheck, MessageCircle, Trash2, MoreHorizontal, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useData, type MarketplaceItem } from '../utils/dataContext';
import { useAuth } from '../utils/authContext';
import { useChat } from '../utils/chatContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

interface MarketplaceCardProps {
  item: MarketplaceItem;
}

export function MarketplaceCard({ item }: MarketplaceCardProps) {
  const { user, currentUser } = useAuth();
  const { toggleSaveItem, incrementItemViews, deleteMarketplaceItem, isItemSaved } = useData();
  const { getOrCreateConversation, sendMessage } = useChat();
  
  const isSaved = isItemSaved(item.id);
  const isOwnItem = user?.id === item.seller.id;
  const isAdmin = user?.role === 'Administrator';

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  // Increment views when component mounts (simulate viewing)
  useEffect(() => {
    const hasViewed = sessionStorage.getItem(`viewed_item_${item.id}`);
    if (!hasViewed) {
      incrementItemViews(item.id);
      sessionStorage.setItem(`viewed_item_${item.id}`, 'true');
    }
  }, [item.id, incrementItemViews]);

  const handleSave = async () => {
    try {
      await toggleSaveItem(item.id);
      toast.success(isSaved ? 'Item unsaved' : 'Item saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update save');
    }
  };

  const handleContactSeller = () => {
    if (!currentUser || isOwnItem) return;
    setIsContactModalOpen(true);
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim() || !currentUser) return;

    try {
      const conversationId = await getOrCreateConversation(
        item.seller.id,
        item.seller.name,
        { type: 'marketplace', itemId: item.id, itemTitle: item.title }
      );

      if (!conversationId) {
        toast.error('Could not start conversation. Please try again.');
        return;
      }

      sendMessage(conversationId, contactMessage.trim());
      setIsContactModalOpen(false);
      setContactMessage('');
      window.location.hash = '#messages';
    } catch (err: any) {
      console.error('[handleSendMessage]', err);
      toast.error(err?.message || 'Failed to send message. Please try again.');
    }
  };

  const handleDeleteItem = async () => {
    try {
      await deleteMarketplaceItem(item.id);
      toast.success('Item deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete item');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getConditionBadgeColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'like new':
        return 'bg-emerald-50 text-emerald-700';
      case 'good':
        return 'bg-blue-50 text-blue-700';
      case 'fair':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <article className="border-b border-[#f0f0f0] px-3 md:px-4 py-3 md:py-4 hover:bg-[#fafafa] transition-colors">
      <div className="flex gap-2 md:gap-3">
        {/* Left: Avatar/Image */}
        <div className="shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm md:text-base">
            {item.seller.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <span className="font-semibold text-black text-xs md:text-sm truncate font-[Roboto]">
                {item.seller.name}
              </span>
              {item.seller.verified && (
                <BadgeCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 shrink-0" />
              )}
              <span className="text-[#999] text-xs md:text-sm shrink-0">· {formatDate(item.postedDate)}</span>
            </div>
            
            {(isOwnItem || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[#999] hover:text-black p-1 rounded-full hover:bg-black/5 transition-colors shrink-0">
                    <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleDeleteItem}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete item
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Item Info */}
          <div className="mb-2 md:mb-3">
            <h3 className="text-[rgb(51,51,51)] text-sm md:text-base mb-1 font-[Roboto]">{item.title}</h3>
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
              <span className="text-black font-semibold text-base md:text-lg font-[Roboto]">${item.price}</span>
              <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${getConditionBadgeColor(item.condition)}`}>
                {item.condition}
              </span>
              <span className="text-[#999] text-[10px] md:text-xs font-[Roboto]">· {item.category}</span>
            </div>
            <p className="text-[#333] text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-[Roboto]">
              {item.description}
            </p>
          </div>

          {/* Image if exists */}
          {item.image && (
            <div className="mb-2 md:mb-3 rounded-xl md:rounded-2xl overflow-hidden border border-[#f0f0f0]">
              <ImageWithFallback
                src={item.image}
                alt={item.title}
                className="w-full max-h-[300px] md:max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-1.5 md:pt-2">
            <div className="flex items-center gap-3 md:gap-4 text-[#999]">
              <button 
                onClick={handleSave}
                className="flex items-center gap-1 md:gap-1.5 hover:text-red-500 transition-colors group"
              >
                <Heart 
                  className={`w-4 h-4 md:w-5 md:h-5 transition-all ${
                    isSaved ? 'fill-red-500 text-red-500' : 'group-hover:scale-110'
                  }`}
                  strokeWidth={1.5}
                />
                {item.savedBy.length > 0 && (
                  <span className="text-xs md:text-sm">{item.savedBy.length}</span>
                )}
              </button>
              
              <div className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm">
                <Eye className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
                <span>{item.views}</span>
              </div>

              <div className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm">
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
                <span className="text-[10px] md:text-xs">{item.seller.contact}</span>
              </div>
            </div>

            {!isOwnItem && (
              <Button 
                onClick={handleContactSeller}
                className="bg-black hover:bg-black/80 text-white px-3 md:px-4 h-7 md:h-8 rounded-full text-xs md:text-sm font-[Roboto]"
              >
                <span className="hidden sm:inline">Contact Seller</span>
                <span className="sm:hidden">Contact</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      <Dialog open={isContactModalOpen} onOpenChange={(open) => { setIsContactModalOpen(open); if (!open) setContactMessage(''); }}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="font-[Roboto]">Contact Seller</DialogTitle>
          </DialogHeader>

          {/* Seller preview */}
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm shrink-0">
              {item.seller.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-sm font-[Roboto]">{item.seller.name}</span>
          </div>

          {/* Post preview */}
          <div className="bg-[#f8f9fb] border border-[#e5e7eb] rounded-lg p-3">
            <p className="text-xs text-[#999] mb-1 font-[Roboto]">About</p>
            <p className="text-sm font-semibold font-[Roboto]">{item.title}</p>
            <p className="text-sm text-[#666] font-[Roboto]">${item.price} · {item.condition}</p>
          </div>

          {/* Message input */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder={`Message ${item.seller.name}...`}
              className="flex-1 border-[#f0f0f0] rounded-full px-4 font-[Roboto]"
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!contactMessage.trim()}
              className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-[#4D8CFF] to-[#0B5FFF] hover:from-[#3D7EF0] hover:to-[#0A54E6]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
