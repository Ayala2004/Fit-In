export const validations = {
  idNumber: (val: string) => {
    const id = String(val).trim();
    if (id.length !== 9 || isNaN(Number(id))) return "תעודת זהות חייבת להכיל 9 ספרות";
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = Number(id[i]);
      let step = digit * ((i % 2) + 1);
      if (step > 9) step -= 9;
      sum += step;
    }
    return sum % 10 === 0 ? "" : "תעודת זהות לא תקינה";
  },
  phoneNumber: (val: string) => (/^0\d{9}$/.test(val) ? "" : "טלפון לא תקין (10 ספרות, מתחיל ב-0)"),
  email: (val: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? "" : "אימייל לא תקין"),
};