const monthMaxDayCounts = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

module.exports = (interaction) => {
    const month = interaction.options.get('month').value;
    const day = interaction.options.get('day').value;
    const year = interaction.options.get('year').value;

    if(month && day && year)
    {
        if(!isValidMonth(month) ||
        (!isValidDay(month, day) && 
        !isLeapYearDay(month, year, day))) return undefined;

        const sessionDate = new Date(year, month-1, day);

        return isDateAfterCurrentDate(sessionDate) ? sessionDate: undefined;
    }
    return undefined;
};

function isValidMonth(month)
{
    return (month < 13);
}

function isValidDay(month, day)
{
    return (day > 0 && day <= monthMaxDayCounts[month-1]);
}

function isLeapYearDay(month, year, day)
{
    return (month === 2 && (year % 4 === 0) && !(day > 29));
}

function isDateAfterCurrentDate(date)
{
    return new Date(date).valueOf() > new Date().valueOf();
}

