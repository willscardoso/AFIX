'use client';

import { useState } from 'react';

export function useLanguage() {
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'pt' ? 'en' : 'pt');
  };

  return { language, setLanguage, toggleLanguage };
}