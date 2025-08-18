
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

      // Use html2canvas to capture the exact visual appearance
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
        // Restore any hidden placeholders
        hiddenNodes.forEach(({ el, visibility }) => {
          el.style.visibility = visibility;
        });
      }

      console.log("Canvas created successfully", canvas.width, canvas.height);

      // Convert to blob and download without trimming to preserve exact spacing
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
      toast({
        title: "Download failed",
        description: "Unable to download meme. Please try again.",
        variant: "destructive"
      });
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
