export enum BotDialogs {
  //CreateSession
  CreateSessionInvalidSessionName = "Your session name is invalid.",
  CreateSessionDMSessionTime = "Hey there, I have your session scheduled for: ",
  CreateSessionOneMoment = "One Moment while I create your session. You will recieve a message via Direct Message when complete!",
  CreateSessionInvalidDateEntered = "The date you entered is invalid. This could be due to the following reasons:\n- You entered a date that doesnt exist.\n- You entered a day that has already passed.",
  //
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
