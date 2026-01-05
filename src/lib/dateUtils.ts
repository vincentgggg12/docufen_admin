import { TFunction } from "i18next";
import { DateTime } from "luxon"
export const getTimezoneName = () => {
  const dt = DateTime.now();
  return dt.zoneName
}

export function pad(num: string, size: number) {
  const s = "000000000" + num;
  return s.slice(s.length - size);
}

export const isToday = (dt: DateTime) => {
  const today = DateTime.now().startOf('day');
  return dt.startOf('day').equals(today);
}

export const formatTime = (dt: DateTime) => {
  const hour = pad(dt.hour.toString(), 2)  // .getUTCHours().toString(), 2)
  const minute = pad(dt.minute.toString(), 2) // .getUTCMinutes().toString(), 2)
  const seconds = pad(dt.second.toString(), 2)  // .getUTCSeconds().toString(), 2)
  return `${hour}:${minute}:${seconds}`
}

export const formatDate = (dt: DateTime, t: TFunction<"translation", undefined>) => {
  const monthNames = [t("Jan"), t("Feb"), t("Mar"), t("Apr"), t("May"), t("Jun"), t("Jul"), t("Aug"), t("Sep"), t("Oct"), t("Nov"), t("Dec")]
  const year = dt.year.toString()
  const day = dt.day
  return t("dateString", { day, month: monthNames[dt.month - 1], year })
}

export const formatDateFromTimestamp = (timestamp: number | undefined, t: TFunction<"translation", undefined>) => {
  if (!timestamp) return ""
  const dt = DateTime.fromMillis(timestamp)
  return formatDate(dt, t)
}
export const formatDateFromDate = (dt: Date, t: TFunction<"translation", undefined>) => {
  const monthNames = [t("Jan"), t("Feb"), t("Mar"), t("Apr"), t("May"), t("Jun"), t("Jul"), t("Aug"), t("Sep"), t("Oct"), t("Nov"), t("Dec")]
  const year = dt.getFullYear().toString()
  const month = monthNames[dt.getMonth()]
  const day = dt.getDate()
  return t("dateString", { day, month, year })
}

export const formatDatetimeString = (dt_: DateTime | number, t: TFunction<"translation", undefined>, useUTC = false) => {
  if (dt_ == null) return ""
  let dt = dt_ as DateTime
  if (typeof dt_ === "number") {
    dt = useUTC ? DateTime.fromMillis(dt_, { zone: 'utc' }) : DateTime.fromMillis(dt_)
  } else if (useUTC && dt.zoneName !== 'UTC') {
    dt = dt.toUTC()
  }
  const monthNames = [t("Jan"), t("Feb"), t("Mar"), t("Apr"), t("May"), t("Jun"), t("Jul"), t("Aug"), t("Sep"), t("Oct"), t("Nov"), t("Dec")]
  const year = dt.year.toString() // .getUTCFullYear().toString()
  const month = monthNames[dt.month - 1] // .getUTCMonth()
  const day = pad(dt.day.toString(), 2)
  const hour = pad(dt.hour.toString(), 2)  // .getUTCHours().toString(), 2)
  const minute = pad(dt.minute.toString(), 2) // .getUTCMinutes().toString(), 2)
  const seconds = pad(dt.second.toString(), 2)  // .getUTCSeconds().toString(), 2)
  const timezone = useUTC ? " UTC" : ""
  return t("dateTimeString", { day, month, year, hour, minute, seconds }) + timezone
};
export const formatDatetimeStringFromTimestamp = (timestamp: number, t: TFunction<"translation", undefined>, useUTC = false) => {
  if (!timestamp) return ""
  const dt = useUTC ? DateTime.fromMillis(timestamp, { zone: 'utc' }) : DateTime.fromMillis(timestamp)
  return formatDatetimeString(dt, t, useUTC)
}