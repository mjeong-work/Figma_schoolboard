import { useState, useMemo } from 'react';
import { NavigationBar } from './components/NavigationBar';
import { EventCard } from './components/EventCard';
import { FloatingActionButton } from './components/FloatingActionButton';
import { CreateEventDialog } from './components/CreateEventDialog';
import { Button } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { Calendar } from './components/ui/calendar';
import { Search, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useData } from './utils/dataContext';
import { useAuth } from './utils/authContext';

export default function EventsPage() {
  const { events, addEvent } = useData();
  const { user } = useAuth();
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // Start from the beginning of current week (Sunday)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });

  const handleCreateEvent = async (newEvent: {
    title: string;
    date: string;
    time: string;
    venue: string;
    description: string;
    image?: string;
    category?: string;
  }) => {
    try {
      await addEvent({
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        venue: newEvent.venue,
        description: newEvent.description,
        image: newEvent.image || '',
        category: newEvent.category,
      });
      toast.success('Event created successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create event');
    }
  };

  // Filter events based on tab and selected date
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...events];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((event) =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query)
      );
    }

    // Apply tab filter
    // Use a local-timezone YYYY-MM-DD string to avoid UTC midnight parsing
    // shifting today's date by one day for UTC+ or UTC- users.
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    switch (selectedTab) {
      case 'upcoming':
        result = result.filter((event) => event.date >= todayStr);
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case 'rsvp':
        result = result.filter((event) => user && event.participants.includes(user.id));
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case 'past':
        result = result.filter((event) => event.date < todayStr);
        result.sort((a, b) => b.date.localeCompare(a.date));
        break;
    }

    // Apply date filter if a date is selected
    if (selectedDate) {
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      result = result.filter((event) => event.date === selectedDateString);
    }

    return result;
  }, [events, selectedTab, selectedDate, searchQuery]);

  // Get dates that have events for calendar highlighting
  const eventDates = useMemo(() => {
    return events.map((event) => new Date(event.date));
  }, [events]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
  };

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  // Generate the 7 days of the current week (Sun-Sat)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar activeTab="events" />
      
      {/* Threads-style Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-[640px] mx-auto px-4 border-b border-[#f0f0f0]">
          {/* Top Bar */}
          <div className="flex items-center py-3 gap-3">
            <h1 className="text-2xl font-bold font-[Bayon]">Events</h1>
            {isSearchOpen ? (
              <>
                <div className="w-1/2 flex items-center gap-2 bg-[#f5f5f5] rounded-full px-[16px] py-[8px] ml-auto">
                  <Search className="w-5 h-5 text-[#999]" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    autoFocus
                    className="flex-1 bg-transparent outline-none text-black placeholder:text-[#999] text-sm"
                  />
                </div>
                <button 
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-black" strokeWidth={1.5} />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors ml-auto"
                >
                  <Search className="w-5 h-5 text-black" strokeWidth={1.5} />
                </button>
                <Button
                  onClick={() => setIsCreateEventOpen(true)}
                  className="bg-black text-white hover:bg-black/90 rounded-full px-4 py-1.5 h-auto text-sm font-[Roboto]"
                >
                  Post
                </Button>
              </>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="w-full bg-transparent border-0 p-0 h-auto justify-start gap-8">
              <TabsTrigger 
                value="upcoming" 
                className="bg-transparent border-0 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-3 data-[state=active]:shadow-none"
              >
                Upcoming
              </TabsTrigger>
              <TabsTrigger 
                value="rsvp" 
                className="bg-transparent border-0 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-3 data-[state=active]:shadow-none"
              >
                My RSVPs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Events Feed - Threads Style */}
      <main className="max-w-[640px] mx-auto">
        {/* Calendar View */}
        <div className="border-b border-[#f0f0f0] py-6 px-4">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {/* Month/Year Header with Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePreviousWeek}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                  aria-label="Previous week"
                >
                  <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h3 className="text-base font-semibold text-black font-[Roboto]">
                  {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                
                <button
                  onClick={handleNextWeek}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                  aria-label="Next week"
                >
                  <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Week View - Sun to Sat */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((date, index) => {
                  const dateString = date.toISOString().split('T')[0];
                  const isSelected = selectedDate?.toISOString().split('T')[0] === dateString;
                  const hasEvent = eventDates.some(
                    (eventDate) => eventDate.toISOString().split('T')[0] === dateString
                  );
                  const isToday = new Date().toISOString().split('T')[0] === dateString;
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                  return (
                    <button
                      key={dateString}
                      onClick={() => handleDateSelect(date)}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-black border-black text-white shadow-lg'
                          : isToday
                          ? 'bg-blue-50 border-blue-200 text-black'
                          : 'bg-white border-[#f0f0f0] text-black hover:border-[#ddd] hover:shadow-md'
                      }`}
                    >
                      <span className={`text-xs mb-1 ${
                        isSelected ? 'text-white/70' : 'text-[#999]'
                      }`}>
                        {dayNames[index]}
                      </span>
                      <span className={`text-xl font-semibold ${
                        isSelected ? 'text-white' : hasEvent ? 'text-blue-600' : 'text-black'
                      }`}>
                        {date.getDate()}
                      </span>
                      {hasEvent && (
                        <div className={`w-1 h-1 rounded-full mt-1 ${
                          isSelected ? 'bg-white' : 'bg-blue-500'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {selectedDate && (
            <div className="mt-4 text-center">
              <p className="text-sm text-[#666] mb-2">
                Showing events for{' '}
                <span className="font-semibold text-black">
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </p>
              <button
                onClick={clearDateFilter}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Show all
              </button>
            </div>
          )}
        </div>

        {/* Events List */}
        {filteredAndSortedEvents.length > 0 ? (
          <div>
            {filteredAndSortedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <p className="text-[#999] text-sm mb-1">No events found</p>
            <p className="text-xs text-[#999]">
              {selectedDate 
                ? 'No events scheduled for this date' 
                : selectedTab === 'rsvp' 
                  ? 'RSVP to your first event' 
                  : 'Be the first to create an event'}
            </p>
          </div>
        )}
      </main>

      {/* Create Event Dialog */}
      <CreateEventDialog 
        open={isCreateEventOpen}
        onOpenChange={setIsCreateEventOpen}
        onSubmit={handleCreateEvent}
      />

      {/* Mobile Floating Action Button */}
      <FloatingActionButton onClick={() => setIsCreateEventOpen(true)} />
    </div>
  );
}