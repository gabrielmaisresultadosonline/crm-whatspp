import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { HelpCircle, Play, List, GraduationCap } from 'lucide-react';

interface TutorialButtonProps {
  onStartInteractive: () => void;
  onShowList: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const TutorialButton = ({
  onStartInteractive,
  onShowList,
  variant = 'outline',
  size = 'default',
  className = ''
}: TutorialButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant}
          size={size}
          className={`gap-2 shrink-0 whitespace-nowrap ${className}`}
        >
          <GraduationCap className="w-4 h-4" />
          <span className="hidden sm:inline">Tutorial</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          Como usar o sistema?
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => {
            setIsOpen(false);
            onStartInteractive();
          }}
          className="cursor-pointer"
        >
          <Play className="w-4 h-4 mr-2 text-primary" />
          <div>
            <div className="font-medium">Tutorial Interativo</div>
            <div className="text-xs text-muted-foreground">
              Guia passo a passo na tela
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => {
            setIsOpen(false);
            onShowList();
          }}
          className="cursor-pointer"
        >
          <List className="w-4 h-4 mr-2 text-primary" />
          <div>
            <div className="font-medium">Ver Tutorial</div>
            <div className="text-xs text-muted-foreground">
              Lista completa de instruções
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
