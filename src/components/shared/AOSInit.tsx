'use client';

import { useEffect } from 'react';
import AOS from 'aos';

export function AOSInit() {
  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
      disable: false,
    });
  }, []);

  return null;
}
