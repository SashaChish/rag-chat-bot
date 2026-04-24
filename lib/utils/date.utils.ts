import dayjs from "dayjs";

const DATE_FORMAT = "MMM D, YYYY";
const DATETIME_FORMAT = "MMM D, YYYY h:mm A";
const TIME_FORMAT = "h:mm A";

export function formatDate(dateString: string): string {
  return dayjs(dateString).format(DATE_FORMAT);
}

export function formatDateTime(dateString: string): string {
  return dayjs(dateString).format(DATETIME_FORMAT);
}

export function formatTime(dateString: string): string {
  return dayjs(dateString).format(TIME_FORMAT);
}
