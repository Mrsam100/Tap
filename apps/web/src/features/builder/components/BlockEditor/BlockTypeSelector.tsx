import React from 'react';
import {
  ArrowRight, Video, Music, ShoppingBag, Newspaper,
  Calendar, Timer, Layout, MessageSquare
} from 'lucide-react';
import { useBuilderStore } from '../../hooks/useBuilderStore';
import type { BlockType } from '@tap/shared';

const BLOCK_TYPES = [
  { id: 'button', icon: ArrowRight, label: 'Link' },
  { id: 'video', icon: Video, label: 'Video' },
  { id: 'music', icon: Music, label: 'Music' },
  { id: 'product', icon: ShoppingBag, label: 'Product' },
  { id: 'newsletter', icon: Newspaper, label: 'Email' },
  { id: 'event', icon: Calendar, label: 'Event' },
  { id: 'timer', icon: Timer, label: 'Timer' },
  { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' },
  { id: 'section', icon: Layout, label: 'Section' },
] as const;

const BlockTypeSelector: React.FC = () => {
  const addBlock = useBuilderStore((s) => s.addBlock);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
      {BLOCK_TYPES.map(b => (
        <button
          key={b.id}
          onClick={() => addBlock(b.id as BlockType)}
          aria-label={`Add ${b.label} block`}
          className="flex flex-col items-center justify-center p-2 min-h-[44px] rounded-lg border border-slate-100 bg-slate-50 hover:border-jam-red hover:bg-white transition-all group"
        >
          <b.icon size={16} className="text-slate-400 group-hover:text-jam-red mb-1" />
          <span className="text-[10px] font-medium text-slate-500 group-hover:text-ink">{b.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BlockTypeSelector;
