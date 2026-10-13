const DAY_MS = 86_400_000;

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || year > 9999) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function toLocalDate(date = new Date()): string {
  return [String(date.getFullYear()).padStart(4, '0'), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function daysUntil(dueDate: string, today: string): number {
  const dayNumber = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day) / DAY_MS;
  };
  return dayNumber(dueDate) - dayNumber(today);
}

export function formatDate(value: string): string {
  const [year, month, day] = value.split('-');
  return day + '/' + month + '/' + year;
}

export function getDeadlineLabel(dueDate: string, today: string): string {
  const days = daysUntil(dueDate, today);
  return days >= 0 ? 'Còn ' + days + ' ngày' : 'Quá hạn ' + Math.abs(days) + ' ngày';
}
