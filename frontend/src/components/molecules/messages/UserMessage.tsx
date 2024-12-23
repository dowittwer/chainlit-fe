import { MessageContext } from 'contexts/MessageContext';
import { useContext, useRef, useState, useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { WidgetContext } from 'context';

import { Box, IconButton, Stack, TextField } from '@mui/material';

import {
  IStep,
  messagesState,
  useChatInteract,
  useConfig
} from '@chainlit/react-client';

import { AccentButton, RegularButton } from 'components/atoms/buttons';
import { Translator } from 'components/i18n';

import PencilIcon from 'assets/pencil';
import { MessageAvatar } from './components/Avatar';

interface Props {
  message: IStep;
}

export default function UserMessage({
  message,
  children
}: React.PropsWithChildren<Props>) {
  const config = useConfig();
  const { evoya } = useContext(WidgetContext);
  const { askUser, loading } = useContext(MessageContext);
  const { editMessage } = useChatInteract();
  const setMessages = useSetRecoilState(messagesState);
  const disabled = loading || !!askUser;
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);

  const isEditable = !!config.config?.features.edit_message;

  const handleEdit = () => {
    if (textFieldRef.current) {
      const newOutput = textFieldRef.current.value;
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === message.id);
        if (index === -1) {
          return prev;
        }
        const slice = prev.slice(0, index + 1);
        slice[index].steps = [];
        return slice;
      });
      setIsEditing(false);
      editMessage({ ...message, output: newOutput });
    }
  };

  useEffect(() => {
    if(evoya?.type === 'dashboard' || config.config?.ui.cot ==='full'){
      setLayout(true)
    }
  }, [evoya,config])
  

  return (
    <Box display="flex" flexDirection="column" width="100%">
      <Box
        display="flex"
        flexDirection={layout ? "row-reverse":'row'}
        justifyContent={layout ? "flex-end":'flex-start'}
        alignItems={layout ? "start":'center'}
        gap={1}
        width="100%"
        sx={{
          marginBottom:layout?'15px':'0',
          '&:hover .edit-icon': {
            visibility: 'visible'
          }
        }}
      >
        {!isEditing && isEditable && (
          <IconButton
            sx={{
              ml: layout ? '0':'auto',
              visibility: 'hidden'
            }}
            className="edit-icon"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
          >
            <PencilIcon sx={{ height: 16, width: 16 }} />
          </IconButton>
        )}
        {
          layout &&
          <Box sx={{order:1,marginTop:'18px'}}>
            <MessageAvatar author={evoya?.username ?? 'You'} />
          </Box>
          }
          <Box
            sx={{
              px: 2.5,
              position: 'relative',
              borderRadius: '1.5rem',
              backgroundColor: 'background.paper',
              width: isEditing ? '100%' : 'auto',
              maxWidth: isEditing ? '100%' : '70%',
              flexGrow: isEditing ? 1 : 0,
              ml: isEditable ? 'default' : 'auto'
            }}
          >
            {isEditing ? (
              <Stack py={1.5}>
                <TextField
                  id="edit-chat-input"
                  multiline
                  autoFocus
                  variant="standard"
                  autoComplete="off"
                  defaultValue={message.output}
                  fullWidth
                  inputRef={textFieldRef}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      pl: 0,
                      width: '100%'
                    }
                  }}
                />
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <RegularButton onClick={() => setIsEditing(false)}>
                    <Translator path="components.molecules.newChatDialog.cancel" />
                  </RegularButton>
                  <AccentButton
                    className="confirm-edit"
                    disabled={disabled}
                    variant="outlined"
                    onClick={handleEdit}
                  >
                    <Translator path="components.molecules.newChatDialog.confirm" />
                  </AccentButton>
                </Box>
              </Stack>
            ) : (
              children
            )}
          </Box>
      </Box>
    </Box>
  );
}
