import React from 'react';
import { User } from 'lucide-react';

export const Avatar = ({ src, alt, className }) => {
  const [error, setError] = React.useState(false);
  const wrapperClass = `${className || ''} overflow-hidden`;
  if (!src || error) {
    return (
      <div className={wrapperClass}>
        <div className="w-full h-full flex items-center justify-center bg-slate-800">
          <User className="w-6 h-6 text-slate-500" />
        </div>
      </div>
    );
  }
  return (
    <div className={wrapperClass}>
      <img src={src} alt={alt || ''} className="w-full h-full object-cover" onError={() => setError(true)} />
    </div>
  );
};
