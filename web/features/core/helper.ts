import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export enum Format {
  DATE = "YYYY-MM-DD",
  TIMESTAMP = "YYYY-MM-DD HH:mm:ss",
  DISPLAY_TIMESTAMP = "DD/MM/YY HH:mm:ss",
  RECEPIT_FORMAT = "YYYYMMDD",
}

export enum ParseYear {
  THAI = "thai",
  CHRIST = "christ",
}

export const now = (): dayjs.Dayjs => {
  return dayjs().tz("Asia/Bangkok");
};

export const formatDate = (
  dt: string,
  yearFormat: ParseYear,
  format: Format
): string => {
  let ti = dayjs(dt);
  switch (yearFormat) {
    case ParseYear.THAI:
      if (ti.year() < 2400) {
        ti = ti.add(543, "years");
      }
      break;
    case ParseYear.CHRIST:
      if (ti.year() > 2400) {
        ti = ti.add(-543, "years");
      }
      break;
  }
  return ti.format(format);
};
