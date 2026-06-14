import { useState } from 'react';
import { Heart, MessageCircle, Calendar, Clock, MapPin, Users, CheckCircle, Send, MoreHorizontal, UserPlus, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Collapsible, CollapsibleContent } from './ui/collapsible';
import { useData, type Event } from '../utils/dataContext';
import { useAuth } from '../utils/authContext';
import { useChat } from '../utils/chatContext';
import { toast } from 'sonner@2.0.3';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const { user } = useAuth();
  const {
    toggleLikeEvent,
    addCommentToEvent,
    toggleRSVPEvent,
    deleteEvent,
    isEventLiked,
    hasRSVPed: hasUserRSVPed
  } = useData();
  const { getOrCreateConversation } = useChat();
  
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  // 에러 방어막 데이터
  const safeVenue = event?.venue || '장소 미지정';
  const isOnlineEvent = safeVenue.startsWith('[온라인]');
  const safeParticipants = event?.participants || [];
  const safeLikes = event?.likes || [];
  const safeComments = event?.comments || [];
  const safeTitle = event?.title || '제목 없음';
  const safeDescription = event?.description || '';
  const safeAuthor = event?.author || 'Campus Events';
  const safeTime = event?.time || '시간 미지정';
  const safeDate = event?.date || new Date().toISOString();

  const isLiked = event?.id ? isEventLiked(event.id) : false;
  const hasRSVPed = event?.id ? hasUserRSVPed(event.id) : false;
  const isOwnEvent = user?.id === event?.authorId;
  const isAdmin = user?.role === 'Administrator';

  // 💡 인원 마감 여부 계산 (제한 인원이 있고, 현재 인원이 가득 찼을 때)
  const isFull = event?.maxParticipants ? (safeParticipants.length >= event.maxParticipants) : false;

  const handleLike = () => { if(event?.id) toggleLikeEvent(event.id); };
  const handleRSVP = () => {
    if(!event?.id) return;
    
    // 💡 이미 신청한 사람이 취소하는 건 언제나 허용, 안 한 사람이 마감되었을 때 신청하는 건 차단
    if (isFull && !hasRSVPed) {
      toast.error('정원이 마감되어 신청할 수 없습니다.');
      return;
    }

    toggleRSVPEvent(event.id);
    hasRSVPed ? toast.success('RSVP cancelled') : toast.success('RSVP confirmed!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !event?.id) return;
    addCommentToEvent(event.id, newComment);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleDeleteEvent = () => {
    if(event?.id) {
      deleteEvent(event.id);
      toast.success('Event deleted');
    }
  };

  const handleContactHost = () => {
    if (!user || isOwnEvent) return;
    setIsMessageModalOpen(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !event) return;
    try {
      const conversationId = await getOrCreateConversation(
        event.authorId, safeAuthor, { type: 'event', itemId: event.id, itemTitle: safeTitle }
      );
      if (!conversationId) return toast.error('Could not start conversation. Please try again.');
      sendMessage(conversationId, messageText.trim());
      setIsMessageModalOpen(false);
      setMessageText('');
      window.location.hash = '#messages';
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send message. Please try again.');
    }
  };

  if (!event) return null;

  return (
    <div className="border-b border-[#f0f0f0] px-4 py-4 hover:bg-[#fafafa] transition-colors">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white text-sm">
            <Calendar className="w-5 h-5" strokeWidth={2} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[15px] text-black font-[Roboto]">{safeAuthor}</span>
              {hasRSVPed && (
                <div className="flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3 fill-blue-500" strokeWidth={2} />
                  <span>Going</span>
                </div>
              )}
              {/* 💡 인원 마감 딱지 표시 */}
              {isFull && !hasRSVPed && (
                <div className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                  <span>마감됨</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#999] text-sm font-[Roboto]">{formatDate(safeDate)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-black/5 rounded-full transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-[#999]" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {(isOwnEvent || isAdmin) && (
                    <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleDeleteEvent}>
                      Delete event
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <h3 className="text-[15px] text-[rgb(51,51,51)] mb-2 leading-snug font-[Roboto]">{safeTitle}</h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#666] mb-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{safeTime}</span>
            </div>
            <span className="text-[#ddd]">•</span>
            
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
              {isOnlineEvent ? (
                <a href={safeVenue.replace('[온라인]', '').trim()} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-medium">
                  온라인 화상회의 참여하기
                  <ExternalLink className="w-3 h-3 text-blue-500" strokeWidth={2} />
                </a>
              ) : (
                <span className="font-medium text-black">{safeVenue}</span>
              )}
            </div>
            
            <span className="text-[#ddd]">•</span>
            {/* 💡 참여 인원수 유동적 표시 (예: 5명 vs 5 / 10명) */}
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" strokeWidth={2} />
              <span className={isFull ? 'text-red-500 font-medium' : ''}>
                {event?.maxParticipants 
                  ? `${safeParticipants.length} / ${event.maxParticipants}명 참여중` 
                  : `${safeParticipants.length}명 참여중`}
              </span>
            </div>
          </div>

          <p className="text-[14px] text-[rgb(51,51,51)] leading-relaxed mb-3 font-[Roboto]">{safeDescription}</p>

          {event.image && (
            <div className="mb-3 rounded-xl overflow-hidden border border-[#f0f0f0]">
              <ImageWithFallback src={event.image} alt={safeTitle} className="w-full h-auto object-cover max-h-[400px]" />
            </div>
          )}

          {!isOnlineEvent && safeVenue !== '장소 미지정' && (
            <div className="mb-4 rounded-xl overflow-hidden border border-[#f0f0f0] bg-[#f9fafb]">
              <iframe
                title="event-location-map" width="100%" height="200" style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(safeVenue)}&t=m&z=17&output=embed`}
              ></iframe>
            </div>
          )}

          <div className="flex items-center gap-1 mb-3">
            {/* 💡 RSVP 버튼 비활성화 및 디자인 변경 로직 */}
            <button 
              onClick={handleRSVP} 
              disabled={isFull && !hasRSVPed}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                hasRSVPed 
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                  : isFull 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' // 마감 시 회색 스타일
                    : 'bg-black text-white hover:bg-black/80'
              }`}
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
              {hasRSVPed ? 'Going' : isFull ? '마감됨' : 'RSVP'}
            </button>
            {!isOwnEvent && (
              <button onClick={handleContactHost} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-black hover:bg-gray-200 transition-colors font-[Roboto]">
                <Send className="w-3.5 h-3.5" strokeWidth={2} />
                Message
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 -ml-2">
            <button onClick={handleLike} className="flex items-center gap-1.5 p-2 hover:bg-black/5 rounded-full transition-colors group">
              <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-black/60 group-hover:text-red-500'}`} strokeWidth={1.5} />
              <span className="text-sm text-[#999]">{safeLikes.length}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 p-2 hover:bg-black/5 rounded-full transition-colors group">
              <MessageCircle className="w-5 h-5 text-black/60 group-hover:text-blue-500 transition-colors" strokeWidth={1.5} />
              <span className="text-sm text-[#999]">{safeComments.length}</span>
            </button>
          </div>

          <Collapsible open={showComments} onOpenChange={setShowComments}>
            <CollapsibleContent className="mt-4 space-y-3">
              <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">{user?.name?.charAt(0) || 'A'}</div>
                <div className="flex-1 flex gap-2">
                  <Input type="text" placeholder="Reply..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }} className="flex-1 border-[#f0f0f0] rounded-full px-4 h-8 text-sm placeholder:text-[#999] focus-visible:ring-1 focus-visible:ring-black/20 focus-visible:border-black/20" />
                  <Button onClick={handleAddComment} size="icon" disabled={!newComment.trim()} className="bg-black hover:bg-black/80 text-white rounded-full h-8 w-8 disabled:opacity-30"><Send className="w-3.5 h-3.5" strokeWidth={2} /></Button>
                </div>
              </div>
              {safeComments.length > 0 && (
                <div className="space-y-3 pl-2">
                  {safeComments.map((comment: any) => {
                    const isOwnComment = user?.id === comment.authorId;
                    return (
                      <div key={comment.id} className="flex gap-2 mt-[0px] mr-[0px] mb-[12px] ml-[-8px]">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mx-[0px] my-[3px]">{comment.author?.charAt(0) || 'U'}</div>
                        <div className="flex-1 min-w-0 mx-[6px] my-[0px]">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-black">{comment.author || 'Unknown'}</span>
                            <span className="text-xs text-[#999]">{formatDate(comment.date || new Date().toISOString())}</span>
                            {(isOwnComment || isAdmin) && <button onClick={() => toast.success('Comment deleted')} className="text-xs text-[#999] hover:text-red-500 transition-colors ml-auto">Delete</button>}
                          </div>
                          <p className="text-sm text-black leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}