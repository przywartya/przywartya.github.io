import { 
  CometChatUIKit, 
  UIKitSettingsBuilder,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";

/**
 * CometChat Constants - Replace with your actual credentials
 */
export const COMETCHAT_CONSTANTS = {
  APP_ID: "2729078a848804ba",
  REGION: "us",
  AUTH_KEY: "6980f068c92c12b168c0a28b5867205a7e761602",
};

export const ALLOWED_USER_IDS = ["123456", "cometchat-uid-1"];

/**
 * Configure the CometChat UI Kit using the UIKitSettingsBuilder.
 */
const UIKitSettings = new UIKitSettingsBuilder()
  .setAppId(COMETCHAT_CONSTANTS.APP_ID)
  .setRegion(COMETCHAT_CONSTANTS.REGION)
  .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
  .subscribePresenceForAllUsers()
  .build();

/**
 * Initialize CometChat
 */
export const initializeCometChat = () => {
  return CometChatUIKit.init(UIKitSettings)
    .then(() => {
      console.log("CometChat UI Kit initialized successfully.");
    })
    .catch((error) => {
      console.error("CometChat UI Kit initialization failed:", error);
    });
};

/**
 * Create a new channel/group
 */
export const createNewChannel = async () => {
  try {
    const groupId = `group_${Date.now()}`;
    const group = new CometChat.Group(
      groupId,
      "New Channel",
      CometChat.GROUP_TYPE.PUBLIC,
      ""
    );

    const createdGroup = await CometChat.createGroup(group);
    console.log("Group created successfully:", createdGroup);

    const membersList = ALLOWED_USER_IDS.map(uid => 
      new CometChat.GroupMember(uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT)
    );
    
    await CometChat.addMembersToGroup(groupId, membersList, []);
    console.log("Users added to group successfully");

    return createdGroup;
  } catch (error) {
    console.error("Error creating channel:", error);
    throw error;
  }
};

/**
 * Join a channel by ID
 */
export const joinChannelById = async (channelId) => {
  if (!channelId.trim()) return;

  try {
    const group = await CometChat.getGroup(channelId);
    console.log("Group fetched successfully:", group);
    
    try {
      await CometChat.joinGroup(group.getGuid(), CometChat.GROUP_TYPE.PUBLIC, "");
      console.log("Group joined successfully");
    } catch (error) {
      console.error("Error joining group api:", error);
    }
    
    return group;
  } catch (error) {
    console.error("Error joining channel:", error);
    throw error;
  }
};

/**
 * Handle user login
 */
export const handleUserLogin = async (currentUserId) => {
  if (!currentUserId) return null;

  try {
    const currentUser = await CometChatUIKit.getLoggedinUser();
    
    if (!currentUser || currentUser.getUid() !== currentUserId) {
      await CometChatUIKit.logout();
      const user = await CometChatUIKit.login(currentUserId);
      console.log("Login Successful:", { user });
      return user;
    }
    
    return currentUser;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

/**
 * Get user details
 */
export const getUserDetails = async (userId) => {
  try {
    const user = await CometChat.getUser(userId);
    return user;
  } catch (error) {
    console.log("User fetching failed with error:", error);
    throw error;
  }
};

/**
 * CometChat UI Components
 */
export const CometChatComponents = {
  MessageHeader: CometChatMessageHeader,
  MessageList: CometChatMessageList,
  MessageComposer: CometChatMessageComposer
}; 