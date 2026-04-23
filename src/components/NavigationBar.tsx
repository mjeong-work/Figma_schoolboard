import { Menu, LogOut, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { useAuth } from '../utils/authContext';
import { useChat } from '../utils/chatContext';

interface NavigationBarProps {
  activeTab?: 'community' | 'events' | 'marketplace' | 'admin' | 'profile' | 'messages';
}

export function NavigationBar({ activeTab = 'community' }: NavigationBarProps) {
  const { logout, user } = useAuth();
  const { getTotalUnreadCount } = useChat();
  const unreadCount = getTotalUnreadCount();
  const isAdmin = user?.role === 'Administrator';

  const navLinks = [
    { name: 'Community', href: '#community', active: activeTab === 'community' },
    { name: 'Events', href: '#events', active: activeTab === 'events' },
    { name: 'Marketplace', href: '#marketplace', active: activeTab === 'marketplace' },
    { name: 'Profile', href: '#profile', active: activeTab === 'profile' },
    ...(isAdmin ? [{ name: 'Admin', href: '#admin', active: activeTab === 'admin' }] : []),
  ];

  const handleLogout = () => {
    logout();
    window.location.hash = '#/community';
  };

  return (
    <nav className="border-b border-[#e5e7eb] bg-white sticky top-0 z-50">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <h2 className="text-[#111] font-bold font-[Bayon] text-[24px]">Campus Connect</h2>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 font-[Roboto]">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg transition-colors font-[Roboto] text-sm ${
                    link.active
                      ? 'text-[#0b5fff]'
                      : 'text-[#666] hover:text-[#111] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <a href="#messages" className="relative">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 ${
                  activeTab === 'messages'
                    ? 'text-[#0b5fff]'
                    : 'text-[#666] hover:text-[#111]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-[Roboto]">Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0b5fff] text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 text-[#666] hover:text-[#111]"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-[Roboto]">Logout</span>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-[#666]">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate to different sections of Campus Connect
              </SheetDescription>
              <div className="flex flex-col gap-2 mt-8 font-[Roboto]">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      link.active
                        ? 'text-[#0b5fff] bg-[#eff6ff]'
                        : 'text-[#666] hover:text-[#111] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {link.name}
                  </a>
                ))}
                <a
                  href="#messages"
                  className={`px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                    activeTab === 'messages'
                      ? 'text-[#0b5fff] bg-[#eff6ff]'
                      : 'text-[#666] hover:text-[#111] hover:bg-[#f5f5f5]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Messages</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 bg-[#0b5fff] text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </a>
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 rounded-lg transition-colors text-[#666] hover:text-[#111] hover:bg-[#f5f5f5] flex items-center gap-2 mt-4 border-t border-[#e5e5e5] pt-6"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}