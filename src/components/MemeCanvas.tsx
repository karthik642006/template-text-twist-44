
import { forwardRef } from "react";
import { TextField, ImageField } from "@/types/meme";
import { CANVAS_CONFIG } from "@/components/meme-editor/MemeEditorCanvas";

interface MemeCanvasProps {
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

const MemeCanvas = forwardRef<HTMLDivElement, MemeCanvasProps>(({
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
  const headerText = textFields.find(field => field.type === 'header');
  const footerText = textFields.find(field => field.type === 'footer');
  const regularTextFields = textFields.filter(field => field.type === 'text');

  return (
    <div className="relative w-full" style={{ 
      marginLeft: CANVAS_CONFIG.containerMargins.left, 
      marginRight: CANVAS_CONFIG.containerMargins.right 
    }}>
      {/* Export Wrapper: includes header, image area, and footer so downloads match preview */}
      <div
        ref={ref}
        data-meme-container
        className="relative bg-white overflow-hidden select-none"
        style={{ 
          margin: `${CANVAS_CONFIG.containerMargins.top} 0 ${CANVAS_CONFIG.containerMargins.bottom} 0`, 
          padding: 0 
        }}
      >
        {/* Header Text (fixed top bar) */}
        {headerText && headerText.text && (
          <div
            data-header-text
            className={`w-full font-bold transition-all duration-300 flex items-center bg-white border-b-2 border-black ${selectedTextId === headerText.id ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50 bg-opacity-20' : ''}`}
            style={{
              fontSize: `${headerText.fontSize * CANVAS_CONFIG.textArea.header.fontSize}px`,
              color: headerText.color,
              fontFamily: headerText.fontFamily,
              fontWeight: CANVAS_CONFIG.textArea.header.fontWeight,
              lineHeight: 1.2,
              opacity: headerText.opacity / 100,
              transform: `rotate(${headerText.rotation}deg) scale(${headerText.scale})`,
              userSelect: 'none',
              touchAction: 'none',
              zIndex: selectedTextId === headerText.id ? 10 : 1,
              whiteSpace: 'pre-wrap',
              padding: CANVAS_CONFIG.textArea.header.padding,
              margin: 0,
              textAlign: CANVAS_CONFIG.textArea.header.textAlign,
              justifyContent: CANVAS_CONFIG.textArea.header.textAlign
            }}
            onMouseDown={e => onMouseDown(e, headerText.id, 'text')}
            onTouchStart={e => onTouchStart(e, headerText.id, 'text')}
          >
            {headerText.text}
          </div>
        )}

        {/* Image Area (overlay elements remain positioned relative to the image only) */}
        <div
          className="relative select-none"
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={templateImage}
            alt="Meme template"
            className="w-full block"
            draggable={false}
            style={{ filter: imageStyle }}
          />

          {/* Regular Text Fields */}
          {regularTextFields.map(field => (
            <div
              key={field.id}
              data-regular-text="true"
              data-placeholder={!field.text}
              className={`absolute cursor-move select-none font-bold text-center px-2 py-1 transition-all duration-300 ${selectedTextId === field.id ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50 bg-opacity-20' : ''}`}
              style={{
                left: `${field.x}%`,
                top: `${field.y}%`,
                fontSize: `${field.fontSize * CANVAS_CONFIG.textArea.regular.fontSize}px`,
                color: field.color,
                fontFamily: field.fontFamily,
                fontWeight: CANVAS_CONFIG.textArea.regular.fontWeight,
                opacity: field.opacity / 100,
                transform: `translate(-50%, -50%) rotate(${field.rotation}deg) scale(${field.scale})`,
                minWidth: '60px',
                userSelect: 'none',
                touchAction: 'none',
                zIndex: selectedTextId === field.id ? 10 : 1,
                whiteSpace: 'pre'
              }}
              onMouseDown={e => onMouseDown(e, field.id, 'text')}
              onTouchStart={e => onTouchStart(e, field.id, 'text')}
            >
              {field.text || "Place your text here"}
            </div>
          ))}

          {/* Image Fields */}
          {imageFields.map(field => (
            <div
              key={field.id}
              className={`absolute cursor-move transition-all duration-300 ${selectedImageId === field.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
              style={{
                left: `${field.x}%`,
                top: `${field.y}%`,
                width: `${field.width * field.scale}px`,
                height: `${field.height * field.scale}px`,
                opacity: field.opacity / 100,
                transform: `translate(-50%, -50%) rotate(${field.rotation}deg)`,
                touchAction: 'none',
                zIndex: selectedImageId === field.id ? 10 : 1
              }}
              onMouseDown={e => onMouseDown(e, field.id, 'image')}
              onTouchStart={e => onTouchStart(e, field.id, 'image')}
            >
              <img src={field.src} alt="Uploaded" className="w-full h-full object-cover" draggable={false} />
            </div>
          ))}
        </div>

        {/* Footer Text (fixed bottom bar) */}
        {footerText && footerText.text && (
          <div
            data-footer-text
            className={`w-full font-bold transition-all duration-300 flex items-center bg-white border-t-2 border-black ${selectedTextId === footerText.id ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50 bg-opacity-20' : ''}`}
            style={{
              fontSize: `${footerText.fontSize * CANVAS_CONFIG.textArea.footer.fontSize}px`,
              color: footerText.color,
              fontFamily: footerText.fontFamily,
              fontWeight: CANVAS_CONFIG.textArea.footer.fontWeight,
              lineHeight: 1.2,
              opacity: footerText.opacity / 100,
              transform: `rotate(${footerText.rotation}deg) scale(${footerText.scale})`,
              userSelect: 'none',
              touchAction: 'none',
              zIndex: selectedTextId === footerText.id ? 10 : 1,
              whiteSpace: 'pre-wrap',
              padding: CANVAS_CONFIG.textArea.footer.padding,
              margin: 0,
              textAlign: CANVAS_CONFIG.textArea.footer.textAlign,
              justifyContent: CANVAS_CONFIG.textArea.footer.textAlign
            }}
            onMouseDown={e => onMouseDown(e, footerText.id, 'text')}
            onTouchStart={e => onTouchStart(e, footerText.id, 'text')}
          >
            {footerText.text}
          </div>
        )}
      </div>
    </div>
  );
});

MemeCanvas.displayName = "MemeCanvas";

export default MemeCanvas;
