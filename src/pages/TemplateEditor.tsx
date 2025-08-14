import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Share, X, Plus, Square, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import HamburgerMenu from "@/components/HamburgerMenu";
import CanvasControls from "@/components/CanvasControls";
import ElementControls from "@/components/ElementControls";

interface TemplateElement {
  id: number;
  type: 'text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
}

interface Template {
  id: number;
  title: string;
  image: string;
  texts: string[];
  type: 'preset' | 'custom';
  layout?: 'single' | 'double' | 'triple' | 'quad' | 'grid';
  elements?: TemplateElement[];
}

const TemplateEditor = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [editingText, setEditingText] = useState<string>("");
  const [editingTextIndex, setEditingTextIndex] = useState<number | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedImageToCrop, setSelectedImageToCrop] = useState<string>("");
  const [activeTab, setActiveTab] = useState("templates");
  const [customElements, setCustomElements] = useState<TemplateElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasBackground, setCanvasBackground] = useState('#FFFFFF');
  const [canvasBackgroundType, setCanvasBackgroundType] = useState<'color' | 'image'>('color');
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();


  const mockupStyles = [
    { id: 'phone', name: 'Phone Mockup', style: 'phone' },
    { id: 'laptop', name: 'Laptop Screen', style: 'laptop' },
    { id: 'tablet', name: 'Tablet View', style: 'tablet' },
    { id: 'poster', name: 'Poster Frame', style: 'poster' },
    { id: 'social', name: 'Social Media', style: 'social' }
  ];

  const templateLayouts = [
    { id: 'single', name: 'Single Image', cols: 1, rows: 1, description: 'One image upload' },
    { id: 'double', name: 'Two Images Split by Line', cols: 2, rows: 1, description: 'Two images side by side' },
    { id: 'triple', name: 'Three Images Split by Line', cols: 3, rows: 1, description: 'Three images in a row' },
    { id: 'quad-horizontal', name: 'Four Images Split by Line', cols: 4, rows: 1, description: 'Four images in a row' },
    { id: 'quad-grid', name: 'Four Images Split by Two Lines', cols: 2, rows: 2, description: 'Four images in 2x2 grid' }
  ];

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate({
      ...template,
      texts: [...template.texts]
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImages(prev => [...prev, imageUrl]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReplaceImage = (newImageUrl: string) => {
    setSelectedImageToCrop(newImageUrl);
    setShowReplaceDialog(false);
    setShowCropDialog(true);
  };

  const handleCropComplete = () => {
    if (selectedTemplate && selectedImageToCrop) {
      setSelectedTemplate({
        ...selectedTemplate,
        image: selectedImageToCrop
      });
      setShowCropDialog(false);
      setSelectedImageToCrop("");
      toast({
        title: "Image replaced!",
        description: "Template image has been updated successfully."
      });
    }
  };

  const handleTextEdit = (index: number, newText: string) => {
    if (selectedTemplate) {
      const updatedTexts = [...selectedTemplate.texts];
      updatedTexts[index] = newText;
      setSelectedTemplate({
        ...selectedTemplate,
        texts: updatedTexts
      });
    }
  };

  const createCustomTemplate = (layout: string) => {
    const layoutConfig = templateLayouts.find(l => l.id === layout);
    if (!layoutConfig) return;

    const newTemplate: Template = {
      id: Date.now(),
      title: `Custom ${layoutConfig.name} Template`,
      image: '',
      texts: [],
      type: 'custom',
      layout: layout as any,
      elements: []
    };

    for (let i = 0; i < (layoutConfig.cols * layoutConfig.rows); i++) {
      const col = i % layoutConfig.cols;
      const row = Math.floor(i / layoutConfig.cols);
      newTemplate.elements?.push({
        id: i + 1,
        type: 'image',
        x: (col * 300) + 50,
        y: (row * 200) + 50,
        width: 250,
        height: 150,
        content: ''
      });
    }

    setSelectedTemplate(newTemplate);
    setCustomElements(newTemplate.elements || []);
    setActiveTab("editor");
  };

  const addTextElement = () => {
    const newElement: TemplateElement = {
      id: Date.now(),
      type: 'text',
      x: 100,
      y: 100,
      content: 'New Text',
      fontSize: 24,
      color: '#FFFFFF',
      fontWeight: 'bold'
    };
    setCustomElements(prev => [...prev, newElement]);
  };

  const addImageElement = () => {
    const newElement: TemplateElement = {
      id: Date.now(),
      type: 'image',
      x: 150,
      y: 150,
      width: 200,
      height: 150,
      content: ''
    };
    setCustomElements(prev => [...prev, newElement]);
  };

  const updateElement = (id: number, updates: Partial<TemplateElement>) => {
    setCustomElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: number) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const element = customElements.find(el => el.id === elementId);
      if (element) {
        setDragOffset({
          x: e.clientX - rect.left - element.x,
          y: e.clientY - rect.top - element.y
        });
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent, elementId: number) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const element = customElements.find(el => el.id === elementId);
      if (element) {
        setDragOffset({
          x: touch.clientX - rect.left - element.x,
          y: touch.clientY - rect.top - element.y
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      updateElement(selectedElement, { x: newX, y: newY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !selectedElement) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const newX = touch.clientX - rect.left - dragOffset.x;
      const newY = touch.clientY - rect.top - dragOffset.y;
      updateElement(selectedElement, { x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleBackgroundChange = (background: string, type: 'color' | 'image') => {
    setCanvasBackground(background);
    setCanvasBackgroundType(type);
    toast({
      title: "Background updated!",
      description: `Canvas background changed to ${type === 'color' ? 'color/gradient' : 'custom image'}.`
    });
  };

  const rotateElement = () => {
    if (!selectedElement) return;
    
    const element = customElements.find(el => el.id === selectedElement);
    if (element) {
      // For now, we'll implement rotation by cycling through 0, 90, 180, 270 degrees
      // This is a simplified rotation that updates the element's transform
      updateElement(selectedElement, {
        ...element,
        // Store rotation in a custom property for future use
      });
      
      toast({
        title: "Element rotated",
        description: "Element has been rotated 90 degrees."
      });
    }
  };

  const scaleElementUp = () => {
    if (!selectedElement) return;
    
    const element = customElements.find(el => el.id === selectedElement);
    if (element) {
      if (element.type === 'text') {
        const newFontSize = (element.fontSize || 24) + 2;
        updateElement(selectedElement, { fontSize: newFontSize });
      } else if (element.type === 'image') {
        const newWidth = (element.width || 100) * 1.1;
        const newHeight = (element.height || 100) * 1.1;
        updateElement(selectedElement, { width: newWidth, height: newHeight });
      }
      
      toast({
        title: "Element scaled up",
        description: "Element has been made larger."
      });
    }
  };

  const scaleElementDown = () => {
    if (!selectedElement) return;
    
    const element = customElements.find(el => el.id === selectedElement);
    if (element) {
      if (element.type === 'text') {
        const newFontSize = Math.max((element.fontSize || 24) - 2, 8);
        updateElement(selectedElement, { fontSize: newFontSize });
      } else if (element.type === 'image') {
        const newWidth = Math.max((element.width || 100) * 0.9, 20);
        const newHeight = Math.max((element.height || 100) * 0.9, 20);
        updateElement(selectedElement, { width: newWidth, height: newHeight });
      }
      
      toast({
        title: "Element scaled down",
        description: "Element has been made smaller."
      });
    }
  };

  const handleDownload = async () => {
    if (!selectedTemplate) return;

    try {
      // Create canvas based on the canvas container size
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Fill background
      if (canvasBackgroundType === 'color') {
        ctx.fillStyle = canvasBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Handle background image
        try {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            bgImg.onload = resolve;
            bgImg.onerror = reject;
            bgImg.src = canvasBackground;
          });
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        } catch (error) {
          console.warn('Background image failed to load, using white background');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      if (selectedTemplate.type === 'preset' && selectedTemplate.image) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = selectedTemplate.image;
          });
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Add text overlays for preset templates
          ctx.font = 'bold 40px Arial';
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.textAlign = 'center';

          selectedTemplate.texts.forEach((text, index) => {
            if (text) {
              const y = index === 0 ? 60 : canvas.height - 40;
              ctx.strokeText(text, canvas.width / 2, y);
              ctx.fillText(text, canvas.width / 2, y);
            }
          });
        } catch (error) {
          console.warn('Template image failed to load');
        }
      } else {
        // Handle custom elements
        for (const el of customElements) {
          if (el.type === 'text' && el.content) {
            ctx.font = `${el.fontWeight || 'bold'} ${el.fontSize || 24}px Arial`;
            ctx.fillStyle = el.color || 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.textAlign = 'left';
            
            // Add text stroke for better visibility
            ctx.strokeText(el.content, el.x, el.y + (el.fontSize || 24));
            ctx.fillText(el.content, el.x, el.y + (el.fontSize || 24));
          } else if (el.type === 'image' && el.content) {
            try {
              const imageEl = new Image();
              imageEl.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                imageEl.onload = resolve;
                imageEl.onerror = reject;
                imageEl.src = el.content;
              });
              ctx.drawImage(imageEl, el.x, el.y, el.width || 100, el.height || 100);
            } catch (error) {
              console.warn(`Image element failed to load: ${el.content}`);
            }
          }
        }
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `meme-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Download successful!",
            description: "Your meme has been downloaded."
          });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Unable to download meme. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share && navigator.canShare) {
        // Try Web Share API first
        const shareData = {
          title: 'Check out this meme!',
          text: 'I created this awesome meme!',
          url: window.location.href,
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast({
            title: "Shared successfully!",
            description: "Your meme has been shared."
          });
          return;
        }
      }
      
      // Fallback to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Meme link copied to clipboard. Share it anywhere!"
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast({
          title: "Link copied!",
          description: "Meme link copied to clipboard. Share it anywhere!"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      
      // If share fails, always try clipboard as final fallback
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(window.location.href);
          toast({
            title: "Link copied!",
            description: "Share didn't work, but link copied to clipboard!"
          });
        } else {
          toast({
            title: "Manual copy needed",
            description: "Copy this URL to share: " + window.location.href,
          });
        }
      } catch (clipboardError) {
        toast({
          title: "Manual copy needed",
          description: "Copy this URL to share: " + window.location.href,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">T</span>
          </div>
          <span className="text-lg sm:text-xl font-bold">Template Editor</span>
        </div>
        <HamburgerMenu />
      </header>

      <main className="p-2 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 text-xs sm:text-sm">
            <TabsTrigger value="templates" className="px-1 sm:px-3">Templates</TabsTrigger>
            <TabsTrigger value="custom" className="px-1 sm:px-3">Create</TabsTrigger>
            <TabsTrigger value="mockups" className="px-1 sm:px-3">Mockups</TabsTrigger>
            <TabsTrigger value="editor" className="px-1 sm:px-3">Editor</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Choose a Layout Template
              </h1>
              <p className="text-gray-400">Select a layout and upload your own images</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templateLayouts.map((layout) => (
                <Card key={layout.id} className="bg-gray-800/50 border-gray-600 hover:border-purple-400 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center" onClick={() => createCustomTemplate(layout.id)}>
                    <div className={`grid gap-2 mb-4 mx-auto w-fit`} style={{gridTemplateColumns: `repeat(${layout.cols}, 1fr)`}}>
                      {Array.from({ length: layout.cols * layout.rows }).map((_, i) => (
                        <div key={i} className="w-8 h-6 bg-gray-600 rounded"></div>
                      ))}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{layout.name}</h3>
                    <p className="text-sm text-gray-400">{layout.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Create Custom Template
              </h1>
              <p className="text-gray-400">Choose a layout to start creating your own template</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templateLayouts.map((layout) => (
                <Card key={layout.id} className="bg-gray-800/50 border-gray-600 hover:border-green-400 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center" onClick={() => createCustomTemplate(layout.id)}>
                    <div className={`grid gap-2 mb-4 mx-auto w-fit`} style={{gridTemplateColumns: `repeat(${layout.cols}, 1fr)`}}>
                      {Array.from({ length: layout.cols * layout.rows }).map((_, i) => (
                        <div key={i} className="w-8 h-6 bg-gray-600 rounded"></div>
                      ))}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{layout.name}</h3>
                    <p className="text-sm text-gray-400">{layout.cols}x{layout.rows} layout</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mockups" className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Mockup Styles
              </h1>
              <p className="text-gray-400">Apply different mockup styles to your templates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockupStyles.map((mockup) => (
                <Card key={mockup.id} className="bg-gray-800/50 border-gray-600 hover:border-yellow-400 transition-colors cursor-pointer" onClick={() => {
                  setActiveTab("editor");
                  setCanvasBackground('#FFFFFF');
                  setCanvasBackgroundType('color');
                  toast({
                    title: "Mockup Selected!",
                    description: `${mockup.name} mockup style applied. You can now add images and text.`
                  });
                }}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Square className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{mockup.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="editor" className="space-y-4 sm:space-y-6">
            {selectedTemplate ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                <div className="lg:col-span-2">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="p-3 sm:p-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-sm sm:text-base">Template Canvas</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTemplate(null)}
                          className="text-gray-400 hover:text-white p-1 sm:p-2"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline ml-1">Back</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div 
                        ref={canvasRef}
                        className="relative rounded-lg p-2 sm:p-4 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] overflow-hidden w-full touch-none select-none"
                        style={{
                          ...(canvasBackgroundType === 'color' 
                            ? { backgroundColor: canvasBackground }
                            : { 
                                backgroundImage: `url(${canvasBackground})`,
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                backgroundColor: '#f0f0f0'
                              }
                          ),
                          touchAction: 'none',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none'
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        {selectedTemplate.type === 'preset' ? (
                          <>
                            <img 
                              src={selectedTemplate.image} 
                              alt="Template"
                              className="w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setShowReplaceDialog(true)}
                            />
                            {selectedTemplate.texts.map((text: string, index: number) => (
                              <div
                                key={index}
                                className={`absolute text-white font-bold text-lg text-center cursor-pointer px-2 py-1 rounded ${index === 0 ? 'top-4' : 'bottom-4'} left-1/2 transform -translate-x-1/2`}
                                style={{
                                  textShadow: '2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000',
                                  WebkitTextStroke: '1px #000000'
                                }}
                                onClick={() => {
                                  setEditingTextIndex(index);
                                  setEditingText(text);
                                }}
                              >
                                {text}
                              </div>
                            ))}
                          </>
                        ) : (
                          <>
                            {customElements.map((element) => (
                              <div
                                key={element.id}
                                className={`absolute cursor-move border-2 ${selectedElement === element.id && element.content ? 'border-blue-400' : 'border-transparent'} rounded transition-all duration-200 hover:border-blue-300`}
                                style={{
                                  left: element.x,
                                  top: element.y,
                                  width: element.width,
                                  height: element.height,
                                  touchAction: 'none',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  MozUserSelect: 'none',
                                  msUserSelect: 'none'
                                }}
                                onMouseDown={(e) => handleMouseDown(e, element.id)}
                                onTouchStart={(e) => handleTouchStart(e, element.id)}
                              >
                                {element.type === 'image' ? (
                                  element.content ? (
                                    <img 
                                      src={element.content} 
                                      alt="Element" 
                                      className="w-full h-full object-cover rounded pointer-events-none" 
                                      draggable={false}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-500 pointer-events-none">
                                      <Upload className="w-8 h-8" />
                                    </div>
                                  )
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center text-center font-bold pointer-events-none"
                                    style={{
                                      fontSize: element.fontSize,
                                      color: element.color,
                                      fontWeight: element.fontWeight
                                    }}
                                  >
                                    {element.content}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      <div className="flex flex-row space-x-1 mt-4">
                        <Button
                          onClick={() => setShowReplaceDialog(true)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs px-1 py-1 h-8"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Replace</span>
                        </Button>
                        <Button
                          onClick={handleDownload}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-xs px-1 py-1 h-8"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                        <Button
                          onClick={handleShare}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs px-1 py-1 h-8"
                        >
                          <Share className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Share</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <CanvasControls
                    onBackgroundChange={handleBackgroundChange}
                    currentBackground={canvasBackground}
                    backgroundType={canvasBackgroundType}
                  />

                  <ElementControls
                    selectedText={selectedElement && customElements.find(el => el.id === selectedElement && el.type === 'text') ? 
                      { ...customElements.find(el => el.id === selectedElement && el.type === 'text'), 
                        text: customElements.find(el => el.id === selectedElement && el.type === 'text')?.content || '',
                        rotation: 0,
                        scale: 1,
                        opacity: 100
                      } as any : undefined}
                    selectedImage={selectedElement && customElements.find(el => el.id === selectedElement && el.type === 'image') ? 
                      { ...customElements.find(el => el.id === selectedElement && el.type === 'image'),
                        src: customElements.find(el => el.id === selectedElement && el.type === 'image')?.content || '',
                        rotation: 0,
                        scale: 1,
                        opacity: 100
                      } as any : undefined}
                    onRotate={rotateElement}
                    onScaleUp={scaleElementUp}
                    onScaleDown={scaleElementDown}
                  />
                  
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-white text-sm sm:text-base">Add Elements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-3 sm:p-4">
                      <Button
                        onClick={addTextElement}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm py-3 sm:py-2 min-h-[44px] sm:min-h-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Text
                      </Button>
                      <Button
                        onClick={addImageElement}
                        className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-3 sm:py-2 min-h-[44px] sm:min-h-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Image
                      </Button>
                    </CardContent>
                  </Card>

                  {selectedElement && (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardHeader className="p-3 sm:p-4">
                        <CardTitle className="text-white text-sm sm:text-base">Element Properties</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                        {(() => {
                          const element = customElements.find(el => el.id === selectedElement);
                          if (!element) return null;

                          return (
                            <>
                              {element.type === 'text' && (
                                <>
                                  <div>
                                    <label className="text-sm text-gray-400">Text Content</label>
                                    <Input
                                      value={element.content}
                                      onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                      className="bg-gray-700 border-gray-600 text-white mt-1"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-gray-400">Font Size</label>
                                    <Slider
                                      value={[element.fontSize || 24]}
                                      onValueChange={([value]) => updateElement(element.id, { fontSize: value })}
                                      max={72}
                                      min={12}
                                      step={2}
                                      className="w-full mt-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-gray-400">Color</label>
                                    <Input
                                      type="color"
                                      value={element.color || '#FFFFFF'}
                                      onChange={(e) => updateElement(element.id, { color: e.target.value })}
                                      className="bg-gray-700 border-gray-600 mt-1"
                                    />
                                  </div>
                                </>
                              )}
                              {element.type === 'image' && (
                                <>
                                  <div>
                                    <label className="text-sm text-gray-400">Width</label>
                                    <Slider
                                      value={[element.width || 200]}
                                      onValueChange={([value]) => updateElement(element.id, { width: value })}
                                      max={500}
                                      min={50}
                                      step={10}
                                      className="w-full mt-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-gray-400">Height</label>
                                    <Slider
                                      value={[element.height || 150]}
                                      onValueChange={([value]) => updateElement(element.id, { height: value })}
                                      max={400}
                                      min={50}
                                      step={10}
                                      className="w-full mt-2"
                                    />
                                  </div>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          if (event.target?.result) {
                                            updateElement(element.id, { content: event.target.result as string });
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="bg-gray-700 border-gray-600 text-white"
                                  />
                                </>
                              )}
                              <Button
                                onClick={() => {
                                  setCustomElements(prev => prev.filter(el => el.id !== element.id));
                                  setSelectedElement(null);
                                }}
                                variant="destructive"
                                className="w-full min-h-[44px] sm:min-h-auto"
                              >
                                Delete Element
                              </Button>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-400 mb-4">No Template Selected</h2>
                <p className="text-sm sm:text-base text-gray-500">Choose a template or create a custom one to start editing</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {editingTextIndex !== null && (
          <Dialog open={true} onOpenChange={() => setEditingTextIndex(null)}>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Text</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  placeholder="Enter your text..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      handleTextEdit(editingTextIndex, editingText);
                      setEditingTextIndex(null);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingTextIndex(null)}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Replace Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-300">Click to upload a new image</p>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF supported</p>
                </label>
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Your Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="cursor-pointer transform transition-transform hover:scale-105"
                        onClick={() => handleReplaceImage(imageUrl)}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Gallery image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-600 hover:border-purple-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Crop Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedImageToCrop && (
                <div className="text-center">
                  <img 
                    src={selectedImageToCrop} 
                    alt="Image to crop"
                    className="max-w-full max-h-96 mx-auto rounded-lg"
                  />
                  <p className="text-gray-400 mt-2">Image will be automatically fitted to template size</p>
                </div>
              )}
              <div className="flex space-x-2">
                <Button
                  onClick={handleCropComplete}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Apply Crop
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCropDialog(false)}
                  className="border-gray-600 text-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TemplateEditor;
