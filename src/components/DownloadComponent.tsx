
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DownloadComponent = () => {
  const { toast } = useToast();

  const handleDownloadClick = async () => {
    console.log("Download component clicked");
    
    try {
      // Find the meme container with the correct data attribute
      const memeContainer = document.querySelector('[data-meme-container]') as HTMLElement;
      
      if (!memeContainer) {
        toast({
          title: "Download failed",
          description: "Could not find meme to download",
          variant: "destructive"
        });
        return;
      }

      console.log("Meme container found:", memeContainer);

      // Use html2canvas to capture the exact visual appearance
      const { default: html2canvas } = await import('html2canvas');

      // Temporarily hide only placeholder text (empty text fields)
      const hiddenNodes: { el: HTMLElement; visibility: string }[] = [];
      memeContainer.querySelectorAll('[data-placeholder="true"]').forEach((node) => {
        const el = node as HTMLElement;
        hiddenNodes.push({ el, visibility: el.style.visibility });
        el.style.visibility = 'hidden';
      });

      let canvas;
      try {
        // Get the exact dimensions and position of the container
        const containerRect = memeContainer.getBoundingClientRect();
        
        canvas = await html2canvas(memeContainer, {
          backgroundColor: 'black',
          scale: 2, // High quality
          useCORS: true,
          allowTaint: false,
          foreignObjectRendering: false,
          logging: false,
          width: memeContainer.offsetWidth,
          height: memeContainer.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          x: 0,
          y: 0,
          // Capture exactly what's visible
          ignoreElements: (element) => {
            // Ignore selection rings and other UI elements
            return element.classList.contains('ring-2') || 
                   element.classList.contains('ring-blue-400') ||
                   element.hasAttribute('data-selection-ring');
          }
        });
      } finally {
        // Restore any hidden placeholders
        hiddenNodes.forEach(({ el, visibility }) => {
          el.style.visibility = visibility;
        });
      }

      console.log("Canvas created successfully", canvas.width, canvas.height);

      // Convert to blob and download with higher quality
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
