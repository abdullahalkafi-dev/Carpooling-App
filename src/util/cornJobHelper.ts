export const parseCustomDateFormat = (dateString: string | Date) => {
  if (dateString instanceof Date) {
    return dateString; // If it's already a Date, return it
  }

  // Ensure dateString is a valid non-empty string before proceeding
  if (typeof dateString !== 'string' || !dateString.includes(', ')) {
    throw new Error(
      'Invalid date format. Expected format: "23 Oct 2024, 14:38".'
    );
  }

  const [datePart, timePart] = dateString.split(', ');
  const [day, month, year] = datePart.split(' ');

  const monthMap: { [key: string]: number } = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const [hours, minutes] = timePart.split(':');

  return new Date(
    Number(year),
    monthMap[month],
    Number(day),
    Number(hours),
    Number(minutes)
  );
};
