import { Stack } from '@mui/material';

import { Logo } from '@chainlit/app/src/components/atoms/logo';

import NewChatButton from './NewChatButton';
import CloseModalButton from './CloseModalButton';
import MaximizeButton from './MaximizeButton';
import ShareSessionButton from './ShareSessionButton';
import FavoriteSessionButton from './FavoriteSessionButton';

import { WidgetContext } from 'context';
import { useContext, useEffect, useState } from 'react';

import { firstUserInteraction, sessionIdState, useChatData } from '@chainlit/react-client';
import { useRecoilValue } from 'recoil';

const sessionTokenKey = 'session_token';

interface Props {
  showClose: boolean;
}

const Header = ({ showClose }: Props): JSX.Element => {
  const { evoya, apiClient, accessToken } = useContext(WidgetContext);
  const firstUserInt = useRecoilValue(firstUserInteraction);
  const [sessionUuid, setSessionUuid] = useState(evoya?.session_uuid ?? '');
  const sessionId = useRecoilValue(sessionIdState);
  const { loading } = useChatData();

  const getSessionUuid = async () => {
    try {
      const sessionResponse = await apiClient.get(`/chat_session_uuid/${sessionId}/`, accessToken);
      const sessionJson = await sessionResponse.json();
      setSessionUuid(sessionJson.session_uuid);
      localStorage.setItem(sessionTokenKey, sessionJson.session_uuid);
      console.log('session_token', sessionJson.session_uuid);
    } catch (e) {
      return;
    }
  }

  useEffect(() => {
    if (!sessionUuid && firstUserInt && !loading) {
      getSessionUuid();
    }
  }, [firstUserInt, loading])

  return (
    <Stack
      px={3}
      py={1.5}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      bgcolor="background.paper"
    >
      {evoya?.type === 'dashboard' ? (
        <div></div>
      ) : (
        <Logo style={{ maxHeight: '25px' }} />
      )}
      <Stack direction="row" alignItems="center" spacing={2}>
        {(evoya?.type === 'dashboard' && sessionUuid) && (
          <>
            <FavoriteSessionButton sessionUuid={sessionUuid} />
            <ShareSessionButton sessionUuid={sessionUuid} />
          </>
        )}
        {evoya?.type !== 'dashboard' &&
          <NewChatButton chat_uuid={evoya?.chat_uuid} />
        }
        {!showClose && <MaximizeButton />}
        {showClose && <CloseModalButton />}
      </Stack>
    </Stack>
  );
};

export default Header;
