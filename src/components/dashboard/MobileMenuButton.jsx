import { Menu, X } from 'lucide-react';

export default function MobileMenuButton({ onToggle, isOpen = false }) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-95"
      style={{
        backgroundColor: isOpen ? 'rgba(233,124,63,0.15)' : 'rgba(28,45,95,0.95)',
        border: `1px solid ${isOpen ? 'rgba(233,124,63,0.4)' : 'rgba(255,255,255,0.15)'}`,
        color: isOpen ? '#e97c3f' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
      }}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      <div
        className="transition-transform duration-200"
        style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </div>
    </button>
  );
}