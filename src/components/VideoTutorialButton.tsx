import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VideoTutorialButtonProps {
  youtubeUrl: string;
  title?: string;
  variant?: 'default' | 'pulse';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const VideoTutorialButton = ({
  youtubeUrl,
  title = 'Tutorial',
  variant = 'default',
  size = 'sm',
  className = '',
}: VideoTutorialButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const iconClassName = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  const getYoutubeEmbedUrl = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
    return url;
  };

  return (
    <>
      <Button
        variant="default"
        size={size}
        onClick={() => setIsOpen(true)}
        className={`
          flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold border-0
          ${variant === 'pulse' ? 'animate-pulse-slow shadow-lg shadow-red-500/30' : ''}
          ${className}
        `}
      >
        <Play className={iconClassName} />
        {title}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden bg-black border-border">
          <DialogHeader className="p-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-foreground">{title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          <div className="aspect-video w-full">
            <iframe
              src={getYoutubeEmbedUrl(youtubeUrl)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
