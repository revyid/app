declare module 'aos' {
  interface AOSOptions {
    duration?: number;
    offset?: number;
    once?: boolean;
    disable?: boolean | 'phone' | 'tablet' | 'mobile' | (() => boolean);
    easing?: string;
    delay?: number;
    anchorPlacement?: string;
    rootMargin?: string;
  }

  const AOS: {
    init(options?: AOSOptions): void;
    refresh(): void;
    refreshHard(): void;
    on(name: string, callback: () => void): void;
  };

  export default AOS;
}
