import Talk from 'talkjs';

export const TALK_APP_ID = 'trqiE0Lx';

export const createTalkUser = (userData) => {
  return new Talk.User(userData);
};

export const createConversation = (session) => {
  const conversation = session.getOrCreateConversation('new_group_chat');
  conversation.setParticipant(session.me);
  return conversation;
}; 