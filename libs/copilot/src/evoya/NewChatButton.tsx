import { Box, Tooltip, Button } from '@mui/material';
import Add from '@mui/icons-material/Add';

import { Translator } from '@chainlit/app/src/components/i18n';

import { WidgetContext } from 'context';
import { useContext } from 'react';

export default function NewChatButton() {
  const { evoya } = useContext(WidgetContext);
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('copilot-new-session'));
  };

  return (
    <Box>
      <Tooltip
        title={<Translator path="components.molecules.newChatButton.newChat" />}
      >
        <Button variant="outlined" startIcon={<Add />} onClick={handleClick} 
            sx={{
              color: (evoya?.headerConfig?.showSessionButton &&  'primary.contrastText'),
              borderColor:evoya?.headerConfig?.showSessionButton &&  'primary.contrastText',
              '&:hover': {
                borderColor: evoya?.headerConfig?.showSessionButton && 'primary.contrastText',
              },
            }}>
          <Translator path="components.molecules.newChatButton.newChatSession" />
        </Button>
      </Tooltip>
    </Box>
  );
}
