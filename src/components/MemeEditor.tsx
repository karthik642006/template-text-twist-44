import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TextField, ImageField } from "@/types/meme";
import MemeCanvas from "./MemeCanvas";
import ElementControls from "./ElementControls";
import TextFieldControls from "./TextFieldControls";
import ImageFieldControls from "./ImageFieldControls";
import ActionToolbar from "./ActionToolbar";
import HamburgerMenu from "./HamburgerMenu";

const MemeEditor = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedElementId, setDraggedElementId] = useState<number | null>(null);
  const [draggedElementType, setDraggedElementType] = useState<'text' | 'image' | null>(null);
  const [imageStyle, setImageStyle] = useState<string>("");
  const [selectedElementTimeout, setSelectedElementTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [textFields, setTextFields] = useState<TextField[]>([
    {
      id: 1,
      text: "TOP TEXT",
      x: 50,
      y: 10,
      fontSize: 32,
      color: "#FFFFFF",
      fontWeight: "bold",
      fontFamily: "Impact",
      opacity: 100,
      rotation: 0,
      scale: 1,
      type: 'header'
    },
    {
      id: 2,
      text: "BOTTOM TEXT",
      x: 50,
      y: 90,
      fontSize: 32,
      color: "#FFFFFF",
      fontWeight: "bold",
      fontFamily: "Impact",
      opacity: 100,
      rotation: 0,
      scale: 1,
      type: 'footer'
    }
  ]);

  const [imageFields, setImageFields] = useState<ImageField[]>([]);
  const [selectedTextId, setSelectedTextId] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [templateImage, setTemplateImage] = useState("https://i.imgflip.com/1ur9b0.jpg");

  const selectedText = textFields.find(field => field.id === selectedTextId);
  const selectedImage = imageFields.find(field => field.id === selectedImageId);

  // Auto-hide selection after 3 seconds
  useEffect(() => {
    if (selectedTextId || selectedImageId) {
      if (selectedElementTimeout) {
        clearTimeout(selectedElementTimeout);
      }
      const timeout = setTimeout(() => {
        setSelectedTextId(0);
        setSelectedImageId(null);
      }, 3000);
      setSelectedElementTimeout(timeout);
    }
    return () => {
      if (selectedElementTimeout) {
        clearTimeout(selectedElementTimeout);
      }
    };
  }, [selectedTextId, selectedImageId]);

  // Load template from localStorage or URL param
  useEffect(() => {
    const savedTemplate = localStorage.getItem('selectedTemplate');
    if (savedTemplate) {
      setTemplateImage(savedTemplate);
      localStorage.removeItem('selectedTemplate');
    }
  }, []);

  const updateTextField = (id: number, updates: Partial<TextField>) => {
    setTextFields(prev => prev.map(field => field.id === id ? { ...field, ...updates } : field));
  };

  const updateImageField = (id: number, updates: Partial<ImageField>) => {
    setImageFields(prev => prev.map(field => field.id === id ? { ...field, ...updates } : field));
  };

  const addTextField = (type: 'text' | 'header' | 'footer' = 'text') => {
    if (type === 'header' && textFields.some(field => field.type === 'header')) {
      return;
    }
    if (type === 'footer' && textFields.some(field => field.type === 'footer')) {
      return;
    }
    const newId = Math.max(...textFields.map(f => f.id), 0) + 1;
    let yPosition = 50;
    let xPosition = 50;
    if (type === 'header') {
      yPosition = 10;
    } else if (type === 'footer') {
      yPosition = 90;
    }
    setTextFields([...textFields, {
      id: newId,
      text: type === 'header' ? "Header text" : type === 'footer' ? "Footer text" : "New text",
      x: xPosition,
      y: yPosition,
      fontSize: 32,
      color: "#FFFFFF",
      fontWeight: "bold",
      fontFamily: "Arial",
      opacity: 100,
      rotation: 0,
      scale: 1,
      type
    }]);
    setSelectedTextId(newId);
  };

  const removeTextField = (id: number) => {
    if (textFields.length > 1) {
      setTextFields(prev => prev.filter(field => field.id !== id));
      if (selectedTextId === id) {
        const remaining = textFields.filter(field => field.id !== id);
        setSelectedTextId(remaining[0]?.id || 0);
      }
    }
  };

  const removeImageField = (id: number) => {
    setImageFields(prev => prev.filter(field => field.id !== id));
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
  };

  const handleImageSelect = (src: string, type: 'upload' | 'emoji' | 'sticker' | 'asset') => {
    const newId = Math.max(...imageFields.map(f => f.id), 0) + 1;
    setImageFields([...imageFields, {
      id: newId,
      src,
      x: 50,
      y: 50,
      width: type === 'emoji' ? 60 : 100,
      height: type === 'emoji' ? 60 : 100,
      opacity: 100,
      rotation: 0,
      scale: 1
    }]);
    setSelectedImageId(newId);
  };

  const handleStyleApply = (style: string) => {
    setImageStyle(style);
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: number, elementType: 'text' | 'image') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDraggedElementId(elementId);
    setDraggedElementType(elementType);
    if (elementType === 'text') {
      setSelectedTextId(elementId);
      setSelectedImageId(null);
    } else {
      setSelectedImageId(elementId);
      setSelectedTextId(0);
    }
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const elementRect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - elementRect.left - elementRect.width / 2,
        y: e.clientY - elementRect.top - elementRect.height / 2
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent, elementId: number, elementType: 'text' | 'image') => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDragging(true);
    setDraggedElementId(elementId);
    setDraggedElementType(elementType);
    if (elementType === 'text') {
      setSelectedTextId(elementId);
      setSelectedImageId(null);
    } else {
      setSelectedImageId(elementId);
      setSelectedTextId(0);
    }
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const elementRect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - elementRect.left - elementRect.width / 2,
        y: touch.clientY - elementRect.top - elementRect.height / 2
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedElementId || !draggedElementType) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const x = (e.clientX - containerRect.left - dragOffset.x) / containerRect.width * 100;
    const y = (e.clientY - containerRect.top - dragOffset.y) / containerRect.height * 100;
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));
    if (draggedElementType === 'text') {
      updateTextField(draggedElementId, {
        x: boundedX,
        y: boundedY
      });
    } else {
      updateImageField(draggedElementId, {
        x: boundedX,
        y: boundedY
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !draggedElementId || !draggedElementType) return;
    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const x = (touch.clientX - containerRect.left - dragOffset.x) / containerRect.width * 100;
    const y = (touch.clientY - containerRect.top - dragOffset.y) / containerRect.height * 100;
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));
    if (draggedElementType === 'text') {
      updateTextField(draggedElementId, {
        x: boundedX,
        y: boundedY
      });
    } else {
      updateImageField(draggedElementId, {
        x: boundedX,
        y: boundedY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedElementId(null);
    setDraggedElementType(null);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDraggedElementId(null);
    setDraggedElementType(null);
  };

  const rotateElement = () => {
    if (selectedText) {
      updateTextField(selectedText.id, {
        rotation: (selectedText.rotation + 15) % 360
      });
    } else if (selectedImage) {
      updateImageField(selectedImage.id, {
        rotation: (selectedImage.rotation + 15) % 360
      });
    }
  };

  const scaleElementUp = () => {
    if (selectedText) {
      updateTextField(selectedText.id, {
        scale: Math.min(selectedText.scale + 0.1, 3)
      });
    } else if (selectedImage) {
      updateImageField(selectedImage.id, {
        scale: Math.min(selectedImage.scale + 0.1, 3)
      });
    }
  };

  const scaleElementDown = () => {
    if (selectedText) {
      updateTextField(selectedText.id, {
        scale: Math.max(selectedText.scale - 0.1, 0.3)
      });
    } else if (selectedImage) {
      updateImageField(selectedImage.id, {
        scale: Math.max(selectedImage.scale - 0.1, 0.3)
      });
    }
  };

  const handleTemplateSelect = (src: string) => {
    setTemplateImage(src);
    toast({
      title: "Template updated!",
      description: "Your new template has been loaded successfully."
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            ← Back
          </Button>
          <span className="text-xl font-bold text-gray-800">Meme Editor</span>
          <Star className="h-5 w-5 text-yellow-500 fill-current" />
        </div>
        <div className="flex items-center">
          <HamburgerMenu />
        </div>
      </header>

      {/* Action Toolbar - Moved outside the preview div */}
      <div className="p-4 flex justify-center bg-white border-b border-gray-100">
        <ActionToolbar 
          onImageGenerated={setTemplateImage}
          onImageSelect={handleImageSelect}
          onStyleApply={handleStyleApply}
          onTemplateSelect={handleTemplateSelect}
        />
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="min-h-full">
          {/* Meme Preview Section */}
          <div className="p-4 sm:p-6 flex items-center justify-center bg-gray-50 min-h-[50vh]">
            <div className="w-full max-w-lg">
              <MemeCanvas
                ref={containerRef}
                templateImage={templateImage}
                imageStyle={imageStyle}
                textFields={textFields}
                imageFields={imageFields}
                selectedTextId={selectedTextId}
                selectedImageId={selectedImageId}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>
          </div>

          {/* Editor Controls Section */}
          <div className="bg-white border-t border-gray-200 p-4 sm:p-6 space-y-6">
            <ElementControls
              selectedText={selectedText}
              selectedImage={selectedImage}
              onRotate={rotateElement}
              onScaleUp={scaleElementUp}
              onScaleDown={scaleElementDown}
            />

            <TextFieldControls
              textFields={textFields}
              selectedTextId={selectedTextId}
              onUpdateField={updateTextField}
              onRemoveField={removeTextField}
              onSelectField={(id) => {
                setSelectedTextId(id);
                setSelectedImageId(null);
              }}
            />

            <ImageFieldControls
              imageFields={imageFields}
              selectedImageId={selectedImageId}
              onUpdateField={updateImageField}
              onRemoveField={removeImageField}
              onSelectField={(id) => {
                setSelectedImageId(id);
                setSelectedTextId(0);
              }}
            />

            {/* Add New Elements */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => addTextField('text')} className="bg-blue-600 hover:bg-blue-700 text-white">
                + New text
              </Button>
              <Button onClick={() => addTextField('header')} variant="outline" className="border-purple-300 text-purple-700" disabled={textFields.some(field => field.type === 'header')}>
                + Header
              </Button>
              <Button onClick={() => addTextField('footer')} variant="outline" className="border-purple-300 text-purple-700" disabled={textFields.some(field => field.type === 'footer')}>
                + Footer
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MemeEditor;
