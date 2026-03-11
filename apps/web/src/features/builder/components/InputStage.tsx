import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';

interface InputStageProps {
  onComplete: (name: string, desc: string) => void;
}

const InputStage: React.FC<InputStageProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div className="max-w-2xl mx-auto pt-24 sm:pt-32 px-4 sm:px-6 animate-fade-up">
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif text-ink mb-4 sm:mb-6">Let's build your site.</h1>
      <p className="text-base sm:text-xl text-slate-500 font-light mb-8 sm:mb-12">
        Tell us about what you're building, and we'll handle the rest.
      </p>

      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-sm font-bold text-ink uppercase tracking-wide">Project Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Studio Selene"
            className="w-full text-xl sm:text-3xl md:text-4xl font-serif border-b-2 border-slate-200 bg-transparent py-3 focus:outline-none focus:border-jam-red transition-colors placeholder:text-slate-300"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-ink uppercase tracking-wide">Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. A boutique architecture firm based in Dubai specializing in commercial spaces."
            className="w-full text-base sm:text-xl font-light border-b-2 border-slate-200 bg-transparent py-3 focus:outline-none focus:border-jam-red transition-colors placeholder:text-slate-300 resize-none h-32"
          />
        </div>

        <div className="pt-4">
          <Button
            size="lg"
            onClick={() => onComplete(name, desc)}
            disabled={!name || !desc}
            className="w-full md:w-auto"
          >
            Generate Site <Sparkles size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InputStage;
