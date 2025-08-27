
import { useState, useRef, useEffect } from "react";
import { TextField, ImageField } from "@/types/meme";
import { toast } from "@/hooks/use-toast";

export const useMemeEditorLogic = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedElementId, setDraggedElementId] = useState<number | null>(null);
  const [draggedElementType, setDraggedElementType] = useState<'text' | 'image' | null>(null);
  const [imageStyle, setImageStyle] = useState<string>("");
  const [selectedElementTimeout, setSelectedElementTimeout] = useState<NodeJS.Timeout | null>(null);

  const [textFields, setTextFields] = useState<TextField[]>([
    {
      id: 1,
      text: "Place your text here",
      x: 50,
      y: 8,
      fontSize: 28,
      color: "#000000",
      fontWeight: "bold",
      fontFamily: "Arial",
      opacity: 100,
      rotation: 0,
      scale: 1,
      type: 'header'
    },
    {
      id: 2,
      text: "Meme text goes here",
      x: 50,
      y: 30,
      fontSize: 32,
      color: "#FFFFFF",
      fontWeight: "bold",
      fontFamily: "Impact",
      opacity: 100,
      rotation: 0,
      scale: 1,
      type: 'text'
    },
    {
      id: 3,
      text: "Place your text here",
      x: 50,
      y: 92,
      fontSize: 28,
      color: "#000000",
      fontWeight: "bold",
      fontFamily: "Arial",
      opacity: 100,
      rotation: 0,
      scale: 1,
      type: 'footer'
    }
  ]);

  const [imageFields, setImageFields] = useState<ImageField[]>([]);
  const [selectedTextId, setSelectedTextId] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [templateImage, setTemplateImage] = useState("/lovable-uploads/b545e16c-6275-4ed7-85e5-e200400ce2d2.png");

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

  // Load template from localStorage
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

  const handleTemplateSelect = (src: string) => {
    setTemplateImage(src);
    toast({
      title: "Template updated!",
      description: "Your new template has been loaded successfully."
    });
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
    const containerRef = document.querySelector('[data-meme-container]');
    if (containerRef) {
      const containerRect = containerRef.getBoundingClientRect();
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
    const containerRef = document.querySelector('[data-meme-container]');
    if (containerRef) {
      const containerRect = containerRef.getBoundingClientRect();
      const elementRect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - elementRect.left - elementRect.width / 2,
        y: touch.clientY - elementRect.top - elementRect.height / 2
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedElementId || !draggedElementType) return;
    const containerRef = document.querySelector('[data-meme-container]');
    if (!containerRef) return;
    const containerRect = containerRef.getBoundingClientRect();
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
    const containerRef = document.querySelector('[data-meme-container]');
    if (!containerRef) return;
    const containerRect = containerRef.getBoundingClientRect();
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
    const selectedText = textFields.find(field => field.id === selectedTextId);
    const selectedImage = imageFields.find(field => field.id === selectedImageId);
    
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
    const selectedText = textFields.find(field => field.id === selectedTextId);
    const selectedImage = imageFields.find(field => field.id === selectedImageId);
    
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
    const selectedText = textFields.find(field => field.id === selectedTextId);
    const selectedImage = imageFields.find(field => field.id === selectedImageId);
    
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

  return {
    textFields,
    imageFields,
    selectedTextId,
    selectedImageId,
    templateImage,
    imageStyle,
    isDragging,
    draggedElementId,
    draggedElementType,
    dragOffset,
    updateTextField,
    updateImageField,
    addTextField,
    removeTextField,
    removeImageField,
    handleImageSelect,
    handleStyleApply,
    handleTemplateSelect,
    handleMouseDown,
    handleTouchStart,
    handleMouseMove,
    handleTouchMove,
    handleMouseUp,
    handleTouchEnd,
    rotateElement,
    scaleElementUp,
    scaleElementDown,
    setSelectedTextId,
    setSelectedImageId
  };
};
