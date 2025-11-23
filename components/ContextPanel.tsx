import React, { useState } from 'react';
import { ContextItem } from '../types';
import { Button } from './Button';

interface ContextPanelProps {
  items: ContextItem[];
  setItems: React.Dispatch<React.SetStateAction<ContextItem[]>>;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ items, setItems }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    
    const newItem: ContextItem = {
      id: crypto.randomUUID(),
      title: newTitle,
      content: newContent,
      isActive: true
    };
    
    setItems(prev => [...prev, newItem]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isActive: !item.isActive } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-full md:w-80 flex-shrink-0 transition-all duration-300">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          Context Lab (RAG)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Paste documentation or code here to "Ground" the AI's responses.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 && !isAdding && (
          <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
            <p className="text-sm">No context added.</p>
            <p className="text-xs mt-1">Add docs to simulate RAG.</p>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="mt-4">
              + Add Source
            </Button>
          </div>
        )}

        {items.map(item => (
          <div key={item.id} className={`p-3 rounded-lg border transition-all ${item.isActive ? 'bg-slate-800/50 border-indigo-500/30' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-sm text-slate-200 truncate pr-2">{item.title}</h3>
              <div className="flex gap-1">
                 <button 
                  onClick={() => toggleItem(item.id)}
                  className={`p-1 rounded ${item.isActive ? 'text-green-400 hover:bg-green-400/10' : 'text-slate-500 hover:bg-slate-700'}`}
                  title={item.isActive ? "Disable Context" : "Enable Context"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-400 line-clamp-3 font-mono bg-black/20 p-2 rounded">
              {item.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        {isAdding ? (
          <div className="space-y-3 animate-fade-in">
            <input 
              type="text" 
              placeholder="Source Title (e.g. 'Redux Docs')" 
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea 
              placeholder="Paste content here..." 
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!newTitle || !newContent} className="flex-1">Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" className="w-full border border-slate-700 bg-slate-800" onClick={() => setIsAdding(true)}>
            + Add New Context Source
          </Button>
        )}
      </div>
    </div>
  );
};