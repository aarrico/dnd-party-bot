export enum BotDialogs {
  //CreateSession
  CreateSessionInvalidSessionName = "Your session name is invalid.",
  CreateSessionDMSessionTime = "Hey there, I have your session scheduled for: ",
  CreateSessionOneMoment = "One Moment while I create your session. You will recieve a message via Direct Message when complete!",
  CreateSessionInvalidDateEntered = "The date you entered is invalid. This could be due to the following reasons:\n- You entered a date that doesnt exist.\n- You entered a day that has already passed.",
  //GetAllUserSessions
  GetAllUserSessions_HereIsTheList = "Here is the list of Sessions on file this user has signed up for:",
  //GetAllSessions
  GetAllSessions_HereIsTheList = "Here is the list of Sessions you currently have on file.",
  //GetAllUsersInASession
  GetAllUsersInASession_HereIsTheList = "Here is the list of Users in this session.",
  //GetAllUsers
  GetAllUsers_HereIsTheList = "Here is the list of Users you currently have on file.",
  //InteractionCreate responses
  InteractionCreate_NonexistentCommand = "You have used a nonexistent command!",
  InteractionCreate_HereIsANewSessionMessage = "Hello everyone, we have a new session for people to join!",
  //RoleChosenMessageContent in InteractionCreate
  RoleChosenMessageContent_WelcomeToTheParty1 = "Welcome to the Party",
  RoleChosenMessageContent_WelcomeToTheParty2 = "You have been added as a",
  RoleChosenMessageContent_Farewell1 = "Farewell,",
  RoleChosenMessageContent_Farewell2 = "You have been removed from the session! To rejoin, click a role button!",
  RoleChosenMessageContent_RoleSwap1 = "Deciding to change the game,",
  RoleChosenMessageContent_RoleSwap2 = "You have been changed to a",
  RoleChosenMessageContent_PartyFull = "Unfortunately, this party is full and no new users can be added at present!",
  RoleChosenMessageContent_DMCantSwap = "You cannot change roles as you are the Dungeon Master!",
  RoleChosenMessageContent_NoActionTaken = "No Action was taken. Something went wrong",
}

//potential resolve path here instead.
export enum BotPaths {
  TempDir = "./src/resources/temp/",
  BaseSessionImageDir = "./src/resources/images/TW_ui_menu_backplate.png",
  ProfileMaskImageDir = "./src/resources/images/profile_mask.png",
}

export enum BotAttachmentFileNames {
  SessionsUserHasSignedUpFor = "SessionsUserHasSignedUpFor.txt",
  AllSessionInformation = "AllSessionInformation.txt",
  AllUserInformation = "AllUserInformation.txt",
  AllUsersInSessionInformation = "AllUsersInSessionInformation.txt",
  CurrentSession = "current-session.png",
}

export enum BotCommandInfo {
  CreateSessionName = "create-session",
  CreateSessionDescription = "creates a session in the session stack.",
  //GetAllUserSessions
  GetAllUserSessions_Name = "get-all-sessions-a-user-is-in",
  GetAllUserSessions_Description = "Retrieves a list of all sessions that a user has signed up for from the db.",
  //GetAllSessions
  GetAllSessions_Name = "get-all-sessions",
  GetAllSessions_Description = "Retrieves a list of all sessions added to db by bot.",
  //GetAllUsersInASession
  GetAllUsersInASession_Name = "get-all-users-in-a-session",
  GetAllUsersInASession_Description = "Retrieves a list of all users in a particular session via Session UUID string added to db by bot.",
  //GetAllUsers
  GetAllUsers_Name = "get-all-users",
  GetAllUsers_Description = "Retrieves a list of all users added to db by bot.",
}

export enum BotCommandOptionInfo {
  //CreateSession
  CreateSession_SessionName = "session-name",
  CreateSession_SessionDescription = "Name of session",
  CreateSession_MonthName = "month",
  CreateSession_MonthDescription = "Month of session",
  CreateSession_DayName = "day",
  CreateSession_DayDescription = "Day of session",
  CreateSession_YearName = "year",
  CreateSession_YearDescription = "Year of session",
  CreateSession_TimeName = "time",
  CreateSession_TimeDescription = "Time that session will take place Format:HH:MM",
  //GetAllUserSessions
  GetAllUserSessions_UserIDName = "user-id",
  GetAllUserSessions_UserIDDescription = "User UUID string that you are finding the sessions for.",
  GetAllUserSessions_SessionIDName = "session-id",
  GetAllUserSessions_SessionIDDescription = "UUID of session in DB(unique identifier)",
  GetAllUserSessions_UserRoleName = "user-role-in-this-session",
  GetAllUserSessions_UserRoleDescription = "User role for session",
  GetAllUserSessions_SessionDateTimeName = "session-date-time",
  GetAllUserSessions_SessionDateTimeDescription = "Date/Time of session in DB",
  GetAllUserSessions_SessionMessageIDName = "session-message-id",
  GetAllUserSessions_SessionMessageIDDescription = "discord message id for session",
  //GetAllSessions
  GetAllSessions_SessionIDName = "session-id",
  GetAllSessions_SessionIDDescription = "UUID of session in DB(unique identifier)",
  GetAllSessions_SessionDateTimeName = "session-date-time",
  GetAllSessions_SessionDateTimeDescription = "Date/Time of session in DB",
  GetAllSessions_SessionMessageIDName = "session-message-id",
  GetAllSessions_SessionMessageIDDescription = "discord message id for session",
  //GetAllUsersInASession
  GetAllUsersInASession_SessionIDName = "session-id",
  GetAllUsersInASession_SessionIDDescription = "UUID of session in DB(unique identifier)",
  GetAllUsersInASession_UserIDName = "user-id",
  GetAllUsersInASession_UserIDDescription = "UUID of user in DB(unique identifier)",
  GetAllUsersInASession_UserRoleName = "user-role-in-this-session",
  GetAllUsersInASession_UserRoleDescription = "discord message id for session",
  GetAllUsersInASession_UserChannelIDName = "user-channel-id",
  GetAllUsersInASession_UserChannelIDDescription = "User DM channel id",
  //GetAllUsers
  GetAllUsers_UserIDName = "user-id",
  GetAllUsers_UserIDDescription = "UUID of user in DB(unique identifier)",
  GetAllUsers_UserChannelIDName = "user-dm-channel-id",
  GetAllUsers_UserChannelIDDescription = "User DM channel id",
}
