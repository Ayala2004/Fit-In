/**
 * בודק האם ניתן עדיין לבצע שיבוץ לגן שנסגר.
 * המועד האחרון הוא 07:00 בבוקר של יום השיבוץ.
 */
export const isRegistrationOpen = (placementDate: Date | string) => {
  const now = new Date();
  const deadline = new Date(placementDate);
  
  // קביעת המועד ל-07:00 בבוקר של אותו תאריך
  deadline.setHours(7, 0, 0, 0);

  return now < deadline;
};

/**
 * פונקציה אופציונלית לבדיקה אם התאריך הוא היום
 */
export const isToday = (date: Date | string) => {
  const d = new Date(date);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};