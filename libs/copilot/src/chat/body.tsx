import { WidgetContext } from 'context';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { Alert, Box } from '@mui/material';

import { ErrorBoundary } from '@chainlit/app/src/components/atoms/ErrorBoundary';
import { TaskList } from '@chainlit/app/src/components/molecules/tasklist/TaskList';
import DropScreen from '@chainlit/app/src/components/organisms/chat/dropScreen';
import ChatSettingsModal from '@chainlit/app/src/components/organisms/chat/settings';
import { useUpload } from '@chainlit/app/src/hooks';
import { IAttachment, attachmentsState } from '@chainlit/app/src/state/chat';
import { projectSettingsState } from '@chainlit/app/src/state/project';
import {
  threadHistoryState,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';
import { sideViewState } from '@chainlit/react-client';

import { ElementSideView } from 'components/ElementSideView';
import { InputBox as InputBoxDefault } from 'components/InputBox';
import PrivacyShield from 'evoya/privacyShield/index';
import TextSectionsCategoriesSimple from 'evoya/privacyShield/TextSectionsCategoriesSimple';
import { usePrivacyShield } from 'evoya/privacyShield/usePrivacyShield';
import InputBox from '@chainlit/app/src/components/organisms/chat/inputBox';

import Messages from './messages';

interface ChatFunctions {
  submit: (text: string) => void;
}

const chatFunctions: ChatFunctions = {
  submit: () => {}
}

const Chat = () => {
  const { apiClient, evoya } = useContext(WidgetContext);
  const projectSettings = useRecoilValue(projectSettingsState);
  const setAttachments = useSetRecoilState(attachmentsState);
  const setThreads = useSetRecoilState(threadHistoryState);
  const [sideViewElement, setSideViewElement] = useRecoilState(sideViewState);
  const [autoScroll, setAutoScroll] = useState(true);
  const { error, disabled } = useChatData();
  const { uploadFile } = useChatInteract();
  const uploadFileRef = useRef(uploadFile);

  const fileSpec = useMemo(
    () => ({
      max_size_mb:
        projectSettings?.features?.spontaneous_file_upload?.max_size_mb || 500,
      max_files:
        projectSettings?.features?.spontaneous_file_upload?.max_files || 20,
      accept: projectSettings?.features?.spontaneous_file_upload?.accept || [
        '*/*'
      ]
    }),
    [projectSettings]
  );

  useEffect(() => {
    uploadFileRef.current = uploadFile;
  }, [uploadFile]);

  const onFileUpload = useCallback(
    (payloads: File[]) => {
      const attachements: IAttachment[] = payloads.map((file) => {
        const id = uuidv4();

        const { xhr, promise } = uploadFileRef.current(
          apiClient,
          file,
          (progress) => {
            setAttachments((prev) =>
              prev.map((attachment) => {
                if (attachment.id === id) {
                  return {
                    ...attachment,
                    uploadProgress: progress
                  };
                }
                return attachment;
              })
            );
          }
        );

        promise
          .then((res) => {
            setAttachments((prev) =>
              prev.map((attachment) => {
                if (attachment.id === id) {
                  return {
                    ...attachment,
                    // Update with the server ID
                    serverId: res.id,
                    uploaded: true,
                    uploadProgress: 100,
                    cancel: undefined
                  };
                }
                return attachment;
              })
            );
          })
          .catch((error) => {
            toast.error(`Failed to upload ${file.name}: ${error.message}`);
            setAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== id)
            );
          });

        return {
          id,
          type: file.type,
          name: file.name,
          size: file.size,
          uploadProgress: 0,
          cancel: () => {
            toast.info(`Cancelled upload of ${file.name}`);
            xhr.abort();
            setAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== id)
            );
          },
          remove: () => {
            setAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== id)
            );
          }
        };
      });
      setAttachments((prev) => prev.concat(attachements));
    },
    [uploadFile]
  );

  const onFileUploadError = useCallback(
    (error: string) => toast.error(error),
    [toast]
  );

  const upload = useUpload({
    spec: fileSpec,
    onResolved: onFileUpload,
    onError: onFileUploadError,
    options: { noClick: true }
  });

  useEffect(() => {
    setThreads((prev) => ({
      ...prev,
      currentThreadId: undefined
    }));
  }, []);

  const enableMultiModalUpload =
    !disabled && projectSettings?.features?.spontaneous_file_upload?.enabled;

  const {
    getPrivacySections,
    enabled,
    enabledVisual,
    sections,
  } = usePrivacyShield();

  const submitFunction = (text: string) => {
    chatFunctions.submit(text);
  }

  const submitProxy = async (text: string, submitFunc: (text: string) => void) => {
    chatFunctions.submit = submitFunc;

    getPrivacySections(text);
  }

  return (
    <Box
      {...(enableMultiModalUpload
        ? upload?.getRootProps({ className: 'dropzone' })
        : {})}
      // Disable the onFocus and onBlur events in react-dropzone to avoid interfering with child trigger events
      onBlur={undefined}
      onFocus={undefined}
      display="flex"
      width="100%"
      flexGrow={1}
      overflow="auto"
    >
      {upload ? (
        <>
          <input id="#upload-drop-input" {...upload.getInputProps()} />
          {upload?.isDragActive ? <DropScreen /> : null}
        </>
      ) : null}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          height: '100%'
        }}
      >
        {error && (
          <Box
            sx={{
              width: '100%',
              mx: 'auto',
              my: 2
            }}
          >
            <Alert sx={{ mx: 2 }} id="session-error" severity="error">
              Could not reach the server.
            </Alert>
          </Box>
        )}
        <ChatSettingsModal />
        <TaskList isMobile={true} />
        <ErrorBoundary>
          <Box
            display="grid"
            flexGrow={1}
            gridTemplateColumns="repeat(3, 1fr)"
            sx={{
              overflowY: 'auto',
            }}
          >
            <Box
              sx={{
                gridColumnStart: `span ${enabledVisual ? 2 : 3}`,
                gridColumnEnd: `span ${enabledVisual ? 2 : 3}`
              }}
            >
              <Messages
                autoScroll={autoScroll}
                projectSettings={projectSettings}
                setAutoScroll={setAutoScroll}
              />
            </Box>
            {(enabledVisual && sections.length > 0) &&
              <Box
                padding={2}
              >
                <TextSectionsCategoriesSimple />
              </Box>
            }
          </Box>
          {evoya?.type === 'default' ? (
            <InputBoxDefault
              fileSpec={fileSpec}
              onFileUpload={onFileUpload}
              onFileUploadError={onFileUploadError}
              autoScroll={autoScroll}
              setAutoScroll={setAutoScroll}
              projectSettings={projectSettings}
            />
          ) : (
            <InputBox
              fileSpec={fileSpec}
              onFileUpload={onFileUpload}
              onFileUploadError={onFileUploadError}
              autoScroll={autoScroll}
              setAutoScroll={setAutoScroll}
              projectSettings={projectSettings}
              submitProxy={enabled ? submitProxy : undefined}
            />
          )}
        </ErrorBoundary>
      </Box>
      {evoya?.type === 'dashboard' && (
        <PrivacyShield submit={submitFunction} />
      )}
      <ElementSideView
        onClose={() => setSideViewElement(undefined)}
        isOpen={!!sideViewElement}
        element={sideViewElement}
      />
    </Box>
  );
};

export default Chat;
