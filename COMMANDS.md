# Party Manager Bot Commands

## Session Management

These commands are used to create, modify, and manage your sessions.

### `/create-session`
Creates a new session in the session stack. This will create a new channel for the session and notify users.

**Options:**
- `session-name` (Required): The name of the session.
- `month` (Required): The month the session will take place.
- `day` (Required): The day of the month.
- `year` (Required): The year.
- `time` (Required): The time of the session. You can use 12-hour format (e.g., "7:00 PM") or 24-hour format (e.g., "19:00").
- `timezone` (Optional): The timezone used for all group communications. If not provided, it defaults to the timezone of the user creating the session.

### `/continue-session`
Creates a new session based on an existing one. It automatically increments the Roman numeral in the session name (e.g., "Campaign Session I" becomes "Campaign Session II").

**Options:**
- `session-channel` (Required): Select the existing session channel you want to continue from.
- `month` (Required): The month for the new session.
- `day` (Required): The day for the new session.
- `year` (Required): The year for the new session.
- `time` (Required): The time for the new session.
- `timezone` (Optional): The timezone for the new session.

### `/modify-session`
Makes changes to an existing session. This will update the session details and regenerate the session image.

**Options:**
- `session-channel` (Required): Select the existing session channel you want to continue from.
- `session-name` (Required): The new name for the session.
- `month` (Required): The new month.
- `day` (Required): The new day.
- `year` (Required): The new year.
- `time` (Optional): The new time.
- `timezone` (Optional): The new timezone.

### `/cancel-session`
Cancels a session and deletes its associated channel.

**Options:**
- `session-channel` (Required): Select the existing session channel you want to continue from.
- `reason` (Required): A message to send to party members explaining why the session was canceled.

### `/set-session-status` (Admin Only)
Manually sets the status of a session. This is primarily for testing or correcting session states.

**Options:**
- `session-id` (Required): The Channel ID of the session.
- `status` (Required): The new status (`Scheduled`, `Active`, `Completed`, `Canceled`).


## Moderation

### `timezone` (text sent in user to bot DM thread)
Allows the user to update their timezone for all direct communications.

### `/send-onboarding` (Admin Only)
Sends a Direct Message to all members of the server asking them to set their timezone. This is useful for onboarding new users or ensuring everyone has their timezone set for accurate session scheduling.

### `/ban`
Bans a member from the server.


## Information

These commands allow you to retrieve information about sessions and users.

### `/get-all-sessions`
Retrieves a list of all sessions stored in the bot's database.

**Options:**
- `session-id` (Optional): Set to `True` to include the session channel ID in the output.
- `include-time` (Optional): Set to `True` to include the scheduled time in the output.
- `campaign-name` (Optional): Set to `True` to include the campaign name in the output.

### `/get-all-sessions-a-user-is-in`
Retrieves a list of all sessions that a specific user has signed up for.

**Options:**
- `user-id` (Required): The User ID of the user. You can find this by right-clicking the user and selecting "Copy User ID".
- `session-id` (Optional): Include the session ID in the output.
- `user-role-in-user-session` (Optional): Include the user's role in the session.
- `include-time` (Optional): Include the scheduled time.
- `campaign-name` (Optional): Include the campaign name.

### `/get-all-users`
Retrieves a list of all users known to the bot.

**Options:**
- `user-id` (Optional): Include the User ID in the output.
- `user-dm-channel-id` (Optional): Include the User's DM Channel ID.

### `/get-all-users-in-a-session` (Admin Only)
Retrieves a list of all users participating in a specific session.

**Options:**
- `session-id` (Required): The Channel ID of the session.
- `user-id` (Optional): Include User IDs.
- `user-role-in-session` (Optional): Include user roles.
- `user-channel-id` (Optional): Include user DM channel IDs.
