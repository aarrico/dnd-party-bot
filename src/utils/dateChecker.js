module.exports = (date) => {
    const month = interaction.options.get('month').value;
    const day = interaction.options.get('day').value;
    const year = interaction.options.get('year').value;
    if(month && day && year)
    {
        const monthMaxDayCounts = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        if(month <= 12 && monthMaxDayCounts[month-1] < day)
        {
            if(month === 2 && (year % 4 === 0))
            {
                if(day > 29)
                {
                    interaction.reply('The date you entered is invalid.');
                    return;
                }
            }
            else
            {
                interaction.reply('The date you entered is invalid.');
                return;
            }
        }
            

        const sessionDate = new Date(year, month, day);

        if(new Date(sessionDate).valueOf() < new Date().valueOf())
        {
            interaction.reply('The date you entered must be after todays date.');
            return;
        }

        interaction.reply(`${sessionDate.getMonth()}/${sessionDate.getDate()}/${sessionDate.getFullYear()}`);
        return sessionDate;
    }
    return undefined;
};