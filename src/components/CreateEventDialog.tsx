import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Upload, X, MapPin, Video, Search } from 'lucide-react';
import { useDaumPostcodePopup } from 'react-daum-postcode'; 

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: {
    title: string;
    date: string;
    time: string;
    venue: string;
    description: string;
    image?: string;
    category?: string;
    maxParticipants?: number;
  }) => void;
}

export function CreateEventDialog({ open, onOpenChange, onSubmit }: CreateEventDialogProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [isOnline, setIsOnline] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueDetail, setVenueDetail] = useState('');
  const [onlineLink, setOnlineLink] = useState('');

  const [category, setCategory] = useState('Academic');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const openPostcode = useDaumPostcodePopup();

  // 💡 [과거 날짜 차단] 컴퓨터의 현재 시간을 기준으로 오늘 날짜를 YYYY-MM-DD 형태로 변환합니다.
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleCompletePostcode = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = '';

    if (data.addressType === 'R') {
      if (data.bname !== '') extraAddress += data.bname;
      if (data.buildingName !== '') {
        extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }

    setVenueName(fullAddress);
    if (data.buildingName) {
      setVenueDetail(data.buildingName + ' ');
    }
  };

  const handleSearchAddress = () => {
    openPostcode({ onComplete: handleCompletePostcode });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalVenue = isOnline 
      ? `[온라인] ${onlineLink.trim()}` 
      : `${venueName.trim()} ${venueDetail.trim()}`.trim();
    
    // 💡 데이터 전송 전 한 번 더 날짜를 검증합니다 (선택된 날짜가 오늘보다 작으면 전송 차단)
    if (!title.trim() || !date || date < todayString || !startTime || !endTime || !finalVenue || !description.trim()) return;

    const newEvent = {
      title: title.trim(),
      date,
      time: `${startTime} - ${endTime}`,
      venue: finalVenue,
      description: description.trim(),
      image: uploadedImage || undefined,
      category,
      maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined 
    };

    onSubmit(newEvent);
    
    setTitle(''); setDate(''); setStartTime(''); setEndTime('');
    setIsOnline(false); setVenueName(''); setVenueDetail(''); setOnlineLink('');
    setCategory('Academic'); setMaxParticipants(''); setDescription(''); setUploadedImage(null);
    onOpenChange(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setTitle(''); setDate(''); setStartTime(''); setEndTime('');
    setIsOnline(false); setVenueName(''); setVenueDetail(''); setOnlineLink('');
    setCategory('Academic'); setMaxParticipants(''); setDescription(''); setUploadedImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#111]">Create New Event</DialogTitle>
          <DialogDescription className="text-[#666]">
            Share your event with the Campus Connect community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="event-title" className="text-[#666] mb-1.5 block">Event Title *</Label>
            <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter event title..." className="border-[#e5e7eb] rounded-lg" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="event-date" className="text-[#666] mb-1.5 block">Date *</Label>
              <Input 
                id="event-date" 
                type="date" 
                value={date} 
                min={todayString} // 💡 min 속성에 오늘 날짜를 넣어 이전 날짜 선택을 원천 차단합니다!
                onChange={(e) => setDate(e.target.value)} 
                className="border-[#e5e7eb] rounded-lg" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="start-time" className="text-[#666] mb-1.5 block">Start Time *</Label>
              <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border-[#e5e7eb] rounded-lg" required />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-[#666] mb-1.5 block">End Time *</Label>
              <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border-[#e5e7eb] rounded-lg" required />
            </div>
          </div>

          <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#f0f0f0]">
            <Label className="text-[#111] font-semibold mb-3 block">Location Type *</Label>
            
            <div className="flex bg-[#e5e7eb]/50 p-1 rounded-lg w-full mb-4">
              <button type="button" onClick={() => setIsOnline(false)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${!isOnline ? 'bg-white shadow-sm text-black' : 'text-[#666] hover:text-black'}`}>
                <MapPin className="w-4 h-4" /> 오프라인 (현장)
              </button>
              <button type="button" onClick={() => setIsOnline(true)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${isOnline ? 'bg-white shadow-sm text-black' : 'text-[#666] hover:text-black'}`}>
                <Video className="w-4 h-4" /> 온라인 (화상)
              </button>
            </div>

            {!isOnline ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="우측 버튼을 눌러 정확한 주소를 찾아주세요 *" value={venueName} readOnly className="border-[#e5e7eb] rounded-lg bg-white flex-1 cursor-not-allowed" required={!isOnline} />
                  <Button type="button" onClick={handleSearchAddress} className="bg-black text-white hover:bg-black/80 px-4 rounded-lg flex items-center gap-1">
                    <Search className="w-4 h-4" /> 주소 검색
                  </Button>
                </div>
                <div>
                  <Input placeholder="상세 위치 (예: 3층 세미나실, 201호) - 선택사항" value={venueDetail} onChange={(e) => setVenueDetail(e.target.value)} className="border-[#e5e7eb] rounded-lg bg-white" />
                </div>
              </div>
            ) : (
              <div>
                <Input type="url" placeholder="화상회의 링크 (예: https://zoom.us/... ) *" value={onlineLink} onChange={(e) => setOnlineLink(e.target.value)} className="border-[#e5e7eb] rounded-lg bg-white" required={isOnline} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-category" className="text-[#666] mb-1.5 block">Category</Label>
              <Input id="event-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Academic, Social" className="border-[#e5e7eb] rounded-lg" />
            </div>
            
            <div>
              <Label htmlFor="event-max-participants" className="text-[#666] mb-1.5 block">정원 제한</Label>
              <select
                id="event-max-participants"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-[#0b5fff] transition-colors cursor-pointer"
              >
                <option value="">제한 없음 (무제한)</option>
                <option value="5">5명</option>
                <option value="10">10명</option>
                <option value="15">15명</option>
                <option value="20">20명</option>
                <option value="30">30명</option>
                <option value="50">50명</option>
                <option value="100">100명</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="event-description" className="text-[#666] mb-1.5 block">Event Description *</Label>
            <Textarea id="event-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your event..." className="border-[#e5e7eb] rounded-lg min-h-[120px]" required />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-3">
            <Button type="button" onClick={handleCancel} className="bg-white border border-[#e5e7eb] text-[#111] hover:bg-[#f9fafb] px-6 py-2 rounded-lg w-full sm:w-auto">Cancel</Button>
            <Button 
              type="submit" 
              // 💡 과거 날짜를 임의로 입력했을 때도 버튼이 눌리지 않도록 disabled 조건에 추가했습니다.
              disabled={!title.trim() || !date || date < todayString || !startTime || !endTime || description.trim() === ''} 
              className="bg-[#0b5fff] hover:bg-[#0949cc] text-white px-6 py-2 rounded-lg shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}