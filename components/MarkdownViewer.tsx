import React from 'react';

interface MarkdownViewerProps {
  content: string;
}

// A simple custom parser to avoid heavyweight dependencies in this environment
// It handles code blocks, basic bolding, and paragraphs.
export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Extract language and code
          const lines = part.split('\n');
          const firstLine = lines[0];
          const language = firstLine.replace('```', '').trim() || 'text';
          const code = lines.slice(1, -1).join('\n'); // remove first and last line (```)

          return (
            <div key={index} className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117] shadow-lg">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-mono text-slate-400 uppercase">{language}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-sm text-slate-200">
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          );
        }

        // Standard text processing
        // Split by newlines for paragraphs
        const paragraphs = part.split('\n\n').filter(p => p.trim());

        return (
          <React.Fragment key={index}>
            {paragraphs.map((p, pIndex) => {
              // Simple bold parsing
              const segments = p.split(/(\*\*.*?\*\*)/g);
              return (
                <p key={pIndex} className="mb-2">
                  {segments.map((seg, sIndex) => {
                    if (seg.startsWith('**') && seg.endsWith('**')) {
                      return <strong key={sIndex} className="text-white font-semibold">{seg.slice(2, -2)}</strong>;
                    }
                    // Handle bullet points crudely
                    if (seg.trim().startsWith('- ')) {
                        return (
                            <span key={sIndex} className="block pl-4 border-l-2 border-slate-600 my-1">
                                {seg.trim().substring(2)}
                            </span>
                        )
                    }
                    return <span key={sIndex}>{seg}</span>;
                  })}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};