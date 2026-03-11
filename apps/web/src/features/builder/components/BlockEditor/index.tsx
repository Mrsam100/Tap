import React, { useState } from 'react';
import {
  GripVertical, Trash2, Type, Palette, Wand2,
  MapPin, Clock, Zap, Shield, ChevronDown, ChevronUp,
  Mail, Calendar, AlertTriangle
} from 'lucide-react';
import { useBuilderStore } from '../../hooks/useBuilderStore';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { ContentBlock } from '@tap/shared';

interface BlockEditorItemProps {
  link: ContentBlock;
  index: number;
  onOptimizeCopy: (id: string, text: string) => void;
}

const BlockEditorItem: React.FC<BlockEditorItemProps> = ({ link, index, onOptimizeCopy }) => {
  const {
    updateLink, removeLink, draggedItemIndex,
    setDraggedItemIndex, reorderLinks
  } = useBuilderStore();
  const [showAccessControl, setShowAccessControl] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const hasAnyGate = link.ageGate || link.emailGate || link.sensitive || link.scheduledStart || link.scheduledEnd;

  const handleDragStart = (e: React.DragEvent) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    setIsDragOver(true);
    reorderLinks(draggedItemIndex, index);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setIsDragOver(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
      className={`
        p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50 transition-all duration-200
        ${draggedItemIndex === index ? 'opacity-40 scale-[0.97] border-dashed border-jam-red/50 dark:border-jam-red/40 shadow-lg' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
        ${isDragOver && draggedItemIndex !== index ? 'border-t-2 border-t-jam-red' : ''}
        ${link.type === 'section' ? 'bg-slate-100/50 dark:bg-slate-800 border-slate-300 dark:border-slate-600' : ''}
      `}
    >
      {/* Link Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500" aria-label="Drag to reorder" role="button" tabIndex={0}>
          <GripVertical size={16} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <input
              value={link.label}
              onChange={(e) => updateLink(link.id, 'label', e.target.value)}
              className={`w-full bg-transparent text-sm font-medium focus:outline-none text-ink dark:text-white placeholder:text-slate-400 ${link.type === 'section' ? 'text-base font-bold' : ''}`}
              placeholder={link.type === 'section' ? "Section Title" : "Block Title"}
            />
            {link.type !== 'section' && (
              <button
                onClick={() => onOptimizeCopy(link.id, link.label)}
                className="p-1 text-slate-400 hover:text-jam-red transition-colors"
                title="AI Optimize Copy"
              >
                <Wand2 size={14} />
              </button>
            )}
          </div>
          {link.type !== 'section' && (
            <input
              value={link.url}
              onChange={(e) => updateLink(link.id, 'url', e.target.value)}
              className="w-full bg-transparent text-xs text-slate-500 dark:text-slate-400 focus:outline-none focus:text-ink dark:focus:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="https://..."
            />
          )}
        </div>
        <button onClick={() => setConfirmDelete(true)} className="text-slate-400 hover:text-red-500 transition-colors p-1" aria-label={`Delete ${link.label || 'block'}`}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Type-specific fields */}
      {link.type === 'product' && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Price</label>
            <input
              value={link.price}
              onChange={(e) => updateLink(link.id, 'price', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-ink dark:text-white"
              placeholder="$0.00"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Image URL</label>
            <input
              value={link.image}
              onChange={(e) => updateLink(link.id, 'image', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-ink dark:text-white"
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      {link.type === 'video' && (
        <div className="mb-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Embed URL</label>
          <input
            value={link.embedUrl}
            onChange={(e) => updateLink(link.id, 'embedUrl', e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-ink dark:text-white"
            placeholder="YouTube/Vimeo Embed URL"
          />
        </div>
      )}

      {link.type === 'timer' && (
        <div className="mb-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Target Date</label>
          <input
            type="datetime-local"
            value={link.countdownDate?.split('.')[0]}
            onChange={(e) => updateLink(link.id, 'countdownDate', new Date(e.target.value).toISOString())}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-ink dark:text-white"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      )}

      {/* Dynamic Routing */}
      {link.type !== 'section' && (
        <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Zap size={10} className="text-amber-500" /> Dynamic Routing
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-jam-red transition-colors min-h-[44px]">
              <MapPin size={14} /> Add Geo Route
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-jam-red transition-colors min-h-[44px]">
              <Clock size={14} /> Add Time Route
            </button>
          </div>
        </div>
      )}

      {/* Access Control */}
      {link.type !== 'section' && (
        <div className="mt-3 pt-3 border-t border-slate-200/50">
          <button
            onClick={() => setShowAccessControl(!showAccessControl)}
            aria-expanded={showAccessControl}
            className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase"
          >
            <span className="flex items-center gap-1">
              <Shield size={10} className="text-blue-500" /> Access Control
              {hasAnyGate && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
            </span>
            {showAccessControl ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showAccessControl && (
            <div className="mt-3 space-y-3">
              {/* Scheduling */}
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-slate-500 uppercase flex items-center gap-1">
                  <Calendar size={10} /> Schedule
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400">Start</label>
                    <input
                      type="datetime-local"
                      value={link.scheduledStart?.slice(0, 16) || ''}
                      onChange={(e) => updateLink(link.id, 'scheduledStart', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-2 text-xs text-ink dark:text-white min-h-[44px]"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">End</label>
                    <input
                      type="datetime-local"
                      value={link.scheduledEnd?.slice(0, 16) || ''}
                      onChange={(e) => updateLink(link.id, 'scheduledEnd', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10px] text-ink dark:text-white"
                      min={link.scheduledStart?.slice(0, 16) || new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
              </div>

              {/* Email Gate */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                  <Mail size={10} /> Require email to view
                </span>
                <input
                  type="checkbox"
                  checked={link.emailGate || false}
                  onChange={(e) => updateLink(link.id, 'emailGate', e.target.checked)}
                  className="w-4 h-4 accent-jam-red"
                />
              </label>

              {/* Age Gate */}
              <div className="space-y-1">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                    <Shield size={10} /> Age restriction
                  </span>
                  <input
                    type="checkbox"
                    checked={link.ageGate || false}
                    onChange={(e) => updateLink(link.id, 'ageGate', e.target.checked)}
                    className="w-4 h-4 accent-jam-red"
                  />
                </label>
                {link.ageGate && (
                  <div className="flex items-center gap-2 pl-4">
                    <label className="text-[9px] text-slate-400">Min age:</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={link.minAge || 18}
                      onChange={(e) => updateLink(link.id, 'minAge', parseInt(e.target.value) || 18)}
                      className="w-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-[10px] text-ink dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Sensitive Content */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                  <AlertTriangle size={10} /> Sensitive content warning
                </span>
                <input
                  type="checkbox"
                  checked={link.sensitive || false}
                  onChange={(e) => updateLink(link.id, 'sensitive', e.target.checked)}
                  className="w-4 h-4 accent-jam-red"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Link Customization */}
      {link.type !== 'section' && (
        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Type size={12} className="text-slate-400" />
            <select
              value={link.style.fontSize}
              onChange={(e) => updateLink(link.id, 'fontSize', e.target.value)}
              className="bg-transparent text-xs text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Palette size={12} className="text-slate-400" />
            <input
              type="color"
              value={link.style.customColor || '#000000'}
              onChange={(e) => updateLink(link.id, 'customColor', e.target.value)}
              className="w-4 h-4 rounded-full border-none cursor-pointer"
              aria-label="Block accent color"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400">Outline</span>
            <input
              type="checkbox"
              checked={link.style.outline}
              onChange={(e) => updateLink(link.id, 'outline', e.target.checked)}
              className="accent-jam-red"
            />
          </label>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Block"
        message={`Delete "${link.label || 'this block'}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { setConfirmDelete(false); removeLink(link.id); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};

export default BlockEditorItem;
