import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface LogoState {
  chatgpt: Position;
  deepseek: Position;
  gemini: Position;
  nanobanana: Position;
}

const basePositions: LogoState = {
  chatgpt: { x: 0, y: -120 },
  deepseek: { x: 180, y: 0 },
  gemini: { x: 0, y: 120 },
  nanobanana: { x: -180, y: 0 },
};

const DraggableAILogos = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerPos, setCenterPos] = useState<Position>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [positions, setPositions] = useState<LogoState>(basePositions);
  const [offsets, setOffsets] = useState<LogoState>({
    chatgpt: { x: 0, y: 0 },
    deepseek: { x: 0, y: 0 },
    gemini: { x: 0, y: 0 },
    nanobanana: { x: 0, y: 0 },
  });

  // Idle trembling animation
  useEffect(() => {
    const speeds = {
      chatgpt: { x: 0.8, y: 1.2, phaseX: 0, phaseY: Math.PI / 2 },
      deepseek: { x: 1.0, y: 0.7, phaseX: Math.PI / 3, phaseY: Math.PI },
      gemini: { x: 0.9, y: 1.1, phaseX: Math.PI / 4, phaseY: 0 },
      nanobanana: { x: 1.1, y: 0.8, phaseX: Math.PI, phaseY: Math.PI / 6 },
    };
    
    let startTime = Date.now();
    
    const animate = () => {
      if (dragging) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const elapsed = (Date.now() - startTime) / 1000;
      
      setOffsets({
        chatgpt: {
          x: Math.sin(elapsed * speeds.chatgpt.x + speeds.chatgpt.phaseX) * 8,
          y: Math.sin(elapsed * speeds.chatgpt.y + speeds.chatgpt.phaseY) * 6,
        },
        deepseek: {
          x: Math.sin(elapsed * speeds.deepseek.x + speeds.deepseek.phaseX) * 10,
          y: Math.sin(elapsed * speeds.deepseek.y + speeds.deepseek.phaseY) * 7,
        },
        gemini: {
          x: Math.sin(elapsed * speeds.gemini.x + speeds.gemini.phaseX) * 7,
          y: Math.sin(elapsed * speeds.gemini.y + speeds.gemini.phaseY) * 9,
        },
        nanobanana: {
          x: Math.sin(elapsed * speeds.nanobanana.x + speeds.nanobanana.phaseX) * 9,
          y: Math.sin(elapsed * speeds.nanobanana.y + speeds.nanobanana.phaseY) * 6,
        },
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dragging]);

  useEffect(() => {
    const updateCenter = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCenterPos({ x: rect.width / 2, y: rect.height / 2 });
      }
    };
    updateCenter();
    window.addEventListener('resize', updateCenter);
    return () => window.removeEventListener('resize', updateCenter);
  }, []);

  const handleMouseDown = useCallback((logoId: string) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(logoId);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    
    // Limit to container bounds
    const maxX = rect.width / 2 - 50;
    const maxY = rect.height / 2 - 50;
    
    setPositions(prev => ({
      ...prev,
      [dragging]: {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      }
    }));
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const logos = [
    { id: 'chatgpt', src: '/ai-logos/chatgpt.png', name: 'ChatGPT' },
    { id: 'deepseek', src: '/ai-logos/deepseek.png', name: 'DeepSeek' },
    { id: 'gemini', src: '/ai-logos/gemini.png', name: 'Gemini' },
    { id: 'nanobanana', src: '/ai-logos/nanobanana.png', name: 'Nano Banana' },
  ];

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[300px] md:h-[340px] select-none"
      style={{ touchAction: 'none' }}
    >
      {/* SVG Lines connecting logos to center */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glowLine">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Animated orbit circles */}
        <circle 
          cx={centerPos.x} 
          cy={centerPos.y} 
          r="80" 
          fill="none" 
          stroke="rgba(147, 197, 253, 0.2)" 
          strokeWidth="1" 
          strokeDasharray="4 4"
          className="animate-[spin_20s_linear_infinite]"
          style={{ transformOrigin: `${centerPos.x}px ${centerPos.y}px` }}
        />
        <circle 
          cx={centerPos.x} 
          cy={centerPos.y} 
          r="120" 
          fill="none" 
          stroke="rgba(147, 197, 253, 0.15)" 
          strokeWidth="1" 
          strokeDasharray="2 6"
          className="animate-[spin_30s_linear_infinite_reverse]"
          style={{ transformOrigin: `${centerPos.x}px ${centerPos.y}px` }}
        />
        
        {/* Dynamic lines from each logo to center */}
        {logos.map((logo) => {
          const pos = positions[logo.id as keyof LogoState];
          const offset = offsets[logo.id as keyof LogoState];
          const logoX = centerPos.x + pos.x + (dragging === logo.id ? 0 : offset.x);
          const logoY = centerPos.y + pos.y + (dragging === logo.id ? 0 : offset.y);
          
          return (
            <g key={logo.id}>
              {/* Main connection line */}
              <line
                x1={logoX}
                y1={logoY}
                x2={centerPos.x}
                y2={centerPos.y}
                stroke="url(#lineGrad)"
                strokeWidth="2"
                filter="url(#glowLine)"
              />
              {/* Animated pulse dot on line */}
              <circle r="4" fill="#60a5fa" className="animate-pulse">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M${logoX},${logoY} L${centerPos.x},${centerPos.y}`}
                />
              </circle>
              {/* Small dot at logo connection point */}
              <circle
                cx={logoX}
                cy={logoY}
                r="3"
                fill="#93c5fd"
              />
            </g>
          );
        })}
      </svg>

      {/* Center MRO API */}
      <div 
        className="absolute z-20"
        style={{
          left: centerPos.x,
          top: centerPos.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-2xl flex flex-col items-center min-w-[100px] ring-4 ring-blue-300/50">
          <img src="/ai-logos/mro-api.png" alt="API MRO" className="h-12 w-12 md:h-14 md:w-14 object-contain" />
          <span className="text-xs md:text-sm font-bold text-gray-700 mt-1">API MRO</span>
        </div>
      </div>

      {/* Draggable Logos */}
      {logos.map((logo) => {
        const pos = positions[logo.id as keyof LogoState];
        const offset = offsets[logo.id as keyof LogoState];
        const isDragging = dragging === logo.id;
        const finalX = pos.x + (isDragging ? 0 : offset.x);
        const finalY = pos.y + (isDragging ? 0 : offset.y);
        
        return (
          <div
            key={logo.id}
            className={`absolute z-10 cursor-grab active:cursor-grabbing ${isDragging ? 'scale-110 shadow-xl' : 'hover:scale-105'}`}
            style={{
              left: centerPos.x + finalX,
              top: centerPos.y + finalY,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={handleMouseDown(logo.id)}
            onTouchStart={handleMouseDown(logo.id)}
          >
            <div className={`bg-white rounded-xl p-2.5 shadow-lg flex flex-col items-center min-w-[70px] md:min-w-[80px] ${isDragging ? 'ring-2 ring-orange-400' : ''}`}>
              <img src={logo.src} alt={logo.name} className="h-8 w-8 md:h-10 md:w-10 object-contain pointer-events-none" />
              <span className="text-[10px] md:text-xs font-bold text-gray-700 mt-1 pointer-events-none">{logo.name}</span>
            </div>
          </div>
        );
      })}
      
      {/* Hint text */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-blue-200 text-[10px] md:text-xs opacity-70">
        Arraste as logos para mover
      </div>
    </div>
  );
};

export default DraggableAILogos;
