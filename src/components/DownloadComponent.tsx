
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DownloadComponent = () => {
  const { toast } = useToast();

  // Trim uniform white borders from a canvas to remove extra whitespace
  const trimCanvas = (canvas: HTMLCanvasElement, tolerance = 8) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const isWhite = (r: number, g: number, b: number, a: number) => {
      if (a === 0) return true; // transparent treated as white
      const T = 255 - tolerance;
      return r >= T && g >= T && b >= T;
    };
    let top = 0, bottom = height - 1, left = 0, right = width - 1;
    // scan from top
    for (; top < height; top++) {
      let allWhite = true;
      for (let x = 0; x < width; x++) {
        const idx = (top * width + x) * 4;
        if (!isWhite(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) { allWhite = false; break; }
      }
      if (!allWhite) break;
    }
    // scan from bottom
    for (; bottom >= top; bottom--) {
      let allWhite = true;
      for (let x = 0; x < width; x++) {
        const idx = (bottom * width + x) * 4;
        if (!isWhite(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) { allWhite = false; break; }
      }
      if (!allWhite) break;
    }
    // scan from left
    for (; left < width; left++) {
      let allWhite = true;
      for (let y = top; y <= bottom; y++) {
        const idx = (y * width + left) * 4;
        if (!isWhite(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) { allWhite = false; break; }
      }
      if (!allWhite) break;
    }
    // scan from right
    for (; right >= left; right--) {
      let allWhite = true;
      for (let y = top; y <= bottom; y++) {
        const idx = (y * width + right) * 4;
        if (!isWhite(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) { allWhite = false; break; }
      }
      if (!allWhite) break;
    }
    const cropW = Math.max(1, right - left + 1);
    const cropH = Math.max(1, bottom - top + 1);
    if (cropW === width && cropH === height) return canvas;
    const out = document.createElement('canvas');
    out.width = cropW; out.height = cropH;
    const outCtx = out.getContext('2d');
    if (!outCtx) return canvas;
    outCtx.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);
    return out;
  };

  const handleDownloadClick = async () => {
    console.log("Download component clicked");
    
    try {
      // Find the entire meme wrapper (parent of meme container)
      const memeContainer = document.querySelector('[data-meme-container]') as HTMLElement;
      
      if (!memeContainer) {
        toast({
          title: "Download failed",
          description: "Could not find meme to download",
          variant: "destructive"
        });
        return;
      }

      // Find the parent container that includes header and footer text
      const memeWrapper = memeContainer.parentElement as HTMLElement;
      
      if (!memeWrapper) {
        toast({
          title: "Download failed", 
          description: "Could not find complete meme area",
          variant: "destructive"
        });
        return;
      }

      console.log("Meme wrapper found:", memeWrapper);

      // Decide capture target: include header/footer only if they exist
      const { default: html2canvas } = await import('html2canvas');

      const headerEl = memeWrapper.querySelector('[data-header-text]') as HTMLElement | null;
      const footerEl = memeWrapper.querySelector('[data-footer-text]') as HTMLElement | null;
      const hasHeaderText = !!(headerEl && headerEl.textContent && headerEl.textContent.trim());
      const hasFooterText = !!(footerEl && footerEl.textContent && footerEl.textContent.trim());
      const targetElement = (hasHeaderText || hasFooterText) ? memeWrapper : memeContainer;

      // Temporarily hide only auto-placeholders from regular text fields
      const hiddenNodes: { el: HTMLElement; visibility: string }[] = [];
      targetElement.querySelectorAll('[data-placeholder="true"]').forEach((node) => {
        const el = node as HTMLElement;
        hiddenNodes.push({ el, visibility: el.style.visibility });
        el.style.visibility = 'hidden';
      });

      let canvas;
      // Temporarily suppress shadows (to avoid extra white margins in output)
      const prevBoxShadow = (targetElement as HTMLElement).style.boxShadow;
      (targetElement as HTMLElement).style.boxShadow = 'none';
      try {
        canvas = await html2canvas(targetElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: false,
          foreignObjectRendering: false,
          logging: false,
          width: targetElement.offsetWidth,
          height: targetElement.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: targetElement.offsetWidth,
          windowHeight: targetElement.offsetHeight
        });
      } finally {
        // Restore any hidden placeholders and styles
        hiddenNodes.forEach(({ el, visibility }) => {
          el.style.visibility = visibility;
        });
        (targetElement as HTMLElement).style.boxShadow = prevBoxShadow;
      }

console.log("Canvas created successfully", canvas.width, canvas.height);

      const outCanvas = trimCanvas(canvas as HTMLCanvasElement, 8);
      console.log("Trimmed canvas size", outCanvas.width, outCanvas.height);

      // Convert to blob and download
      outCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `meme-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          console.log("Download successful");
          toast({
            title: "Download successful!",
            description: "Your meme has been downloaded as PNG."
          });
        } else {
          throw new Error('Failed to create blob from canvas');
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Download error:', error);
      
      // Enhanced fallback method
      try {
        console.log("Attempting fallback download method");
        const memeContainer = document.querySelector('[data-meme-container]') as HTMLElement;
        if (!memeContainer) throw new Error('No meme container found');

        const memeWrapper = memeContainer.parentElement as HTMLElement;
        if (!memeWrapper) throw new Error('No meme wrapper found');

        // Get all elements using explicit data attributes
        const backgroundImg = memeContainer.querySelector('img') as HTMLImageElement;
        const headerText = memeWrapper.querySelector('[data-header-text]') as HTMLElement | null;
        const footerText = memeWrapper.querySelector('[data-footer-text]') as HTMLElement | null;
        const textElements = memeContainer.querySelectorAll('[data-regular-text]');
        
        console.log("Found background image:", !!backgroundImg);
        console.log("Found header text:", !!headerText && headerText !== memeContainer);
        console.log("Found footer text:", !!footerText && footerText !== memeContainer);
        console.log("Found text elements:", textElements.length);

        // Create canvas with proper dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Wait for image to load if needed
        if (backgroundImg && !backgroundImg.complete) {
          await new Promise<void>((resolve, reject) => {
            backgroundImg.onload = () => resolve();
            backgroundImg.onerror = () => reject(new Error('Image failed to load'));
          });
        }

        // Determine capture area based on whether header/footer have text
        const wrapperRect = memeWrapper.getBoundingClientRect();
        const containerRect = memeContainer.getBoundingClientRect();

        const includeHeader = !!(headerText && headerText !== memeContainer && headerText.textContent?.trim());
        const includeFooter = !!(footerText && footerText !== memeContainer && footerText.textContent?.trim());
        const captureOnlyImage = !includeHeader && !includeFooter;

        const targetWidth = captureOnlyImage ? containerRect.width : wrapperRect.width;
        const targetHeight = captureOnlyImage ? containerRect.height : wrapperRect.height;

        canvas.width = Math.max(targetWidth * 2, 400);
        canvas.height = Math.max(targetHeight * 2, 400);
        ctx.scale(2, 2);

        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Calculate positions relative to the capture area
        const baseTop = captureOnlyImage ? containerRect.top : wrapperRect.top;
        const headerOffset = includeHeader ? headerText!.getBoundingClientRect().top - baseTop : 0;
        const containerOffset = containerRect.top - baseTop;
        const footerOffset = includeFooter ? footerText!.getBoundingClientRect().top - baseTop : 0;

        // Draw header text if exists with proper padding
        if (headerText && headerText !== memeContainer && headerText.textContent?.trim()) {
          console.log("Drawing header text:", headerText.textContent);
          
          // Create dark background for header
          const headerRect = headerText.getBoundingClientRect();
          const headerHeight = headerRect.height;
          
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, headerOffset, targetWidth, headerHeight);
          
          const computedStyle = window.getComputedStyle(headerText);
          const fontSize = Math.max(parseInt(computedStyle.fontSize) || 32, 16);
          
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          
          // Position text with proper padding (12px top, 8px bottom as per MemeCanvas)
          const x = 12; // Left padding
          const y = headerOffset + (headerHeight / 2);
          
          ctx.fillText(headerText.textContent, x, y);
        }

        // Draw background image
        if (backgroundImg && backgroundImg.complete && backgroundImg.naturalWidth > 0) {
          console.log("Drawing background image");
          ctx.drawImage(backgroundImg, 0, containerOffset, containerRect.width, containerRect.height);
        }

        // Draw regular text elements
        textElements.forEach((element, index) => {
          const htmlElement = element as HTMLElement;
          const text = htmlElement.textContent?.trim() || '';
          
          if (text) {
            console.log(`Drawing text element ${index + 1}:`, text);
            
            const computedStyle = window.getComputedStyle(htmlElement);
            const fontSize = Math.max(parseInt(computedStyle.fontSize) || 32, 16);
            const elementRect = htmlElement.getBoundingClientRect();
            
            const x = (elementRect.left - wrapperRect.left) + (elementRect.width / 2);
            const y = (elementRect.top - wrapperRect.top) + (elementRect.height / 2);
            
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = Math.max(fontSize / 16, 2);
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#FFFFFF';
            
            const lines = text.split('\n');
            lines.forEach((line, lineIndex) => {
              const lineY = y + (lineIndex - (lines.length - 1) / 2) * fontSize * 1.2;
              ctx.strokeText(line, x, lineY);
              ctx.fillText(line, x, lineY);
            });
          }
        });

        // Draw footer text if exists with proper padding
        if (footerText && footerText !== memeContainer && footerText.textContent?.trim()) {
          console.log("Drawing footer text:", footerText.textContent);
          
          // Create dark background for footer
          const footerRect = footerText.getBoundingClientRect();
          const footerHeight = footerRect.height;
          
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, footerOffset, targetWidth, footerHeight);
          
          const computedStyle = window.getComputedStyle(footerText);
          const fontSize = Math.max(parseInt(computedStyle.fontSize) || 32, 16);
          
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          
          // Position text with proper padding (8px top, 12px bottom as per MemeCanvas)
          const x = 12; // Left padding
          const y = footerOffset + (footerHeight / 2);
          
          ctx.fillText(footerText.textContent, x, y);
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
            
            console.log("Fallback download successful");
            toast({
              title: "Download successful!",
              description: "Your meme has been downloaded as PNG."
            });
          } else {
            throw new Error('Failed to create blob from fallback canvas');
          }
        }, 'image/png', 1.0);

      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        toast({
          title: "Download failed",
          description: "Unable to download meme. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none hover:from-orange-600 hover:to-red-600 text-xs px-2 h-8" 
      onClick={handleDownloadClick}
    >
      <Download className="w-3 h-3 mr-1" />
      <span className="hidden sm:inline">DL</span>
      <span className="sm:hidden">DL</span>
    </Button>
  );
};

export default DownloadComponent;
