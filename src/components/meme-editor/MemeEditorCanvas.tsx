
import { forwardRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MemeCanvas from "@/components/MemeCanvas";
import { TextField, ImageField } from "@/types/meme";

interface MemeEditorCanvasProps {
  templateImage: string;
  imageStyle: string;
  textFields: TextField[];
  imageFields: ImageField[];
  selectedTextId: number;
  selectedImageId: number | null;
  onMouseDown: (e: React.MouseEvent, elementId: number, elementType: 'text' | 'image') => void;
  onTouchStart: (e: React.TouchEvent, elementId: number, elementType: 'text' | 'image') => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

// Configuration object for easy editing of canvas styling
export const CANVAS_CONFIG = {
  // Container padding and margins
  containerMargins: {
    left: '0px',
    right: '0px',
    top: '4px',
    bottom: '2px'
  },
  
  // Text area configuration
  textArea: {
    // Header text styling
    header: {
      padding: '3px 5px',
      textAlign: 'left' as const,
      borderWidth: '2px',
      fontSize: 0.4, // multiplier for fontSize
      fontWeight: '900'
    },
    
    // Footer text styling  
    footer: {
      padding: '3px 5px', 
      textAlign: 'left' as const,
      borderWidth: '2px',
      fontSize: 0.4, // multiplier for fontSize
      fontWeight: '900'
    },
    
    // Regular text styling
    regular: {
      fontSize: 0.4, // multiplier for fontSize
      fontWeight: '900'
    }
  },
  
  // Canvas background and spacing
  canvas: {
    backgroundColor: 'black',
    minHeight: '40vh'
  }
};

const MemeEditorCanvas = forwardRef<HTMLDivElement, MemeEditorCanvasProps>(({
  templateImage,
  imageStyle,
  textFields,
  imageFields,
  selectedTextId,
  selectedImageId,
  onMouseDown,
  onTouchStart,
  onMouseMove,
  onMouseUp,
  onTouchMove,
  onTouchEnd
}, ref) => {
  return (
    <ScrollArea className="h-[calc(100vh-80px)]">
      <div className="min-h-full">
        {/* Meme Preview Section */}
        <div className="p-4 sm:p-6 flex items-center justify-center bg-gray-50" style={{ minHeight: CANVAS_CONFIG.canvas.minHeight }}>
          <div className="w-full max-w-lg">
            <MemeCanvas
              ref={ref}
              templateImage={templateImage}
              imageStyle={imageStyle}
              textFields={textFields}
              imageFields={imageFields}
              selectedTextId={selectedTextId}
              selectedImageId={selectedImageId}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
});

MemeEditorCanvas.displayName = "MemeEditorCanvas";

export default MemeEditorCanvas;
