import React, { useCallback } from 'react';
import { Session, Chatbox } from '@talkjs/react';
import { TALK_APP_ID, createTalkUser, createConversation } from '../services/talkService';

function TalkChat({ currentUser }) {
  const syncConversation = useCallback((session) => {
    return createConversation(session);
  }, []);

  const syncUser = useCallback(
    () => currentUser ? createTalkUser(currentUser) : null,
    [currentUser]
  );

  if (!currentUser) return null;

  return (
    <Session appId={TALK_APP_ID} syncUser={syncUser}>
      <Chatbox
        syncConversation={syncConversation}
        conversationId="sample_group_chat"
        style={{ width: '100%', height: '500px' }}
      />
    </Session>
  );
}

export default TalkChat; 