import { Home, Plus, Calendar, User } from 'lucide-react';

type Page = 'home' | 'log' | 'calendar' | 'profile';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const navItems: { id: Page; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <Home size={22} />, label: 'Home' },
    { id: 'log', icon: <Plus size={22} />, label: 'Log' },
    { id: 'calendar', icon: <Calendar size={22} />, label: 'Calendar' },
    { id: 'profile', icon: <User size={22} />, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f1419] border-t border-gray-800">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
              currentPage === item.id ? 'text-emerald-500' : 'text-gray-500'
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
