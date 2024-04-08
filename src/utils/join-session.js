const {sessionStack} = require('index.js');
module.exports = (client, role) => {
    sessionStack.sessions = [...sessions, 
        {
            sessionId: '01',
            sessionName: 'session 1',
            sessionDM: client.username,
            sessionDate: 
            {
                day: 1,
                month: 1,
                year: 2028,
                time: '8am'
            },
            sessionParty: [
                {
                    username: 'user',
                    userChannelId: 'userid',
                    role: role
                }
            ]
        }    
    ]

}