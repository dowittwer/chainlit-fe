import Chat from 'chat';
import { useState, useEffect } from 'react';

import { Box } from '@mui/material';
import Fade from '@mui/material/Fade';
import Popper from '@mui/material/Popper';
import useMediaQuery from '@mui/material/useMediaQuery';

import Header from 'components/Header';
import EvoyaHeader from 'evoya/EvoyaHeader';
import { EvoyaConfig } from 'evoya/types';

interface Props {
  anchorEl?: HTMLElement | null;
  buttonHeight: string;
  evoya:EvoyaConfig;
}

export default function PopOver({ anchorEl, evoya }: Props) {
  const isMobileLayout = useMediaQuery('(max-width: 599px)');
  const [visualViewportHeight, setVisualViewportHeight] = useState(window.visualViewport?.height ?? window.innerHeight);
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(window.visualViewport?.offsetTop ?? 0);

  const viewportHandler = () => {
    if (window.visualViewport) {
      setVisualViewportHeight(window.visualViewport.height);
      setVisualViewportOffsetTop(window.visualViewport.offsetTop);
    }
  }

  useEffect(() => {
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", viewportHandler);
      window.visualViewport.addEventListener("scroll", viewportHandler);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", viewportHandler);
        window.visualViewport.removeEventListener("scroll", viewportHandler);
      }
    }
    
  }, []);

  return (
    <Popper
      id="chainlit-copilot-popover"
      open={Boolean(anchorEl)}
      anchorEl={isMobileLayout ? null : anchorEl}
      placement="top"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        inset: {
          sm: `${visualViewportOffsetTop}px 0px ${window.innerHeight - visualViewportOffsetTop}px 0px !important`,
          md: evoya?.chatBubbleConfig && evoya?.chatBubbleConfig?.size=='full_screen'?'10px !important':'auto auto 14px -24px !important'
        },
        height: {
          sm: `${visualViewportHeight}px`,
          md: evoya?.chatBubbleConfig 
              ? evoya.chatBubbleConfig.size=='full_screen' 
                ? '98vh':`min(${evoya.chatBubbleConfig.height}, calc(100vh - 100px))`
              : 'min(730px, calc(100vh - 100px))' 
        },
        width: {
          sm: '100%',
          md: evoya?.chatBubbleConfig 
          ? evoya?.chatBubbleConfig.size=='full_screen' 
            ? "98vw" 
            :`min(${evoya.chatBubbleConfig.width}, 96vw)`
          :'min(400px, 80vw)'
        },
        overflow: 'hidden',
        borderRadius: {
          md:'12px'
        },
        background: (theme: any) => theme.palette.background.default,
        boxShadow:
          '0 6px 6px 0 rgba(0,0,0,.02),0 8px 24px 0 rgba(0,0,0,.12)!important',
        zIndex: 9999,
        top:{
          md: evoya?.chatBubbleConfig && evoya?.chatBubbleConfig.size=='full_screen' &&'10px !important'
        },
        left:{
          md: evoya?.chatBubbleConfig && evoya?.chatBubbleConfig.size=='full_screen' &&'10px !important'
        },
        position:{
           md: evoya?.chatBubbleConfig &&  evoya?.chatBubbleConfig.size=='full_screen' &&'fixed !important'
        },
        transform: evoya?.chatBubbleConfig 
        && evoya.chatBubbleConfig.size === 'full_screen' 
          ? 'none !important' 
          : 'translate(0, 0)'
      }}
    >
      <Fade in={!!anchorEl}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%'
          }}
        >
          {/* <Header /> */}
          <EvoyaHeader showClose={true} noShow={false} />
          <Chat />
        </Box>
      </Fade>
    </Popper>
  );
}
