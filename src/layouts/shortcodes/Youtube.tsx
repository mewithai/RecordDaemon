import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const Youtube = ({
  id,
  title,
  ...rest
}: {
  id: string;
  title: string;
  [key: string]: any;
}) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    import("@justinribeiro/lite-youtube");

    const element = ref.current;
    if (!element) return;

    const handleIframeLoaded = (event: any) => {
      const iframe = element.shadowRoot?.querySelector('iframe');
      if (!iframe) return;

      // Load YouTube IFrame Player API if not loaded
      if (!window.YT) {
        window.onYouTubeIframeAPIReady = () => {
          initPlayer(iframe);
        };
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      } else {
        initPlayer(iframe);
      }
    };

    const initPlayer = (iframe: HTMLIFrameElement) => {
      const player = new window.YT.Player(iframe, {
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              // Remove iframe and reset to thumbnail
              const frame = element.shadowRoot?.querySelector('#frame');
              if (frame) {
                frame.classList.remove('activated');
                const existingIframe = frame.querySelector('iframe');
                if (existingIframe) {
                  existingIframe.remove();
                }
                (element as any).isIframeLoaded = false;
              }
            }
          }
        }
      });
    };

    element.addEventListener('liteYoutubeIframeLoaded', handleIframeLoaded);

    return () => {
      element.removeEventListener('liteYoutubeIframeLoaded', handleIframeLoaded);
    };
  }, []);

  // @ts-ignore
  return <lite-youtube ref={ref} className="rounded-lg" videoid={id} videotitle={title} {...rest} />;
};

export default Youtube;
