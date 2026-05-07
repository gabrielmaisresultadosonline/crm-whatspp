import { X } from "lucide-react";

interface VideoLightboxProps {
  video: {
    title: string;
    description?: string;
    video_url: string;
    video_type: string;
  };
  onClose: () => void;
}

export const VideoLightbox = ({ video, onClose }: VideoLightboxProps) => {
  const getVideoEmbedUrl = () => {
    if (video.video_type === "youtube") {
      const url = video.video_url;
      let videoId = "";
      if (url.includes("youtube.com/watch")) videoId = new URL(url).searchParams.get("v") || "";
      else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      else if (url.includes("youtube.com/embed/")) videoId = url.split("embed/")[1]?.split("?")[0] || "";
      else videoId = url;
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return video.video_url;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      <div 
        className="w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
          {video.video_type === "youtube" ? (
            <iframe 
              src={getVideoEmbedUrl()} 
              className="w-full h-full" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen 
            />
          ) : (
            <video src={video.video_url} controls autoPlay className="w-full h-full" />
          )}
        </div>
        
        <div className="mt-4 px-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{video.title}</h2>
          {video.description && (
            <p className="text-gray-400 mt-2 text-sm sm:text-base">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
