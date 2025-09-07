import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const formatTime = (time: string) => {
  if (!time) return "-";
  // 转成北京时间
  return dayjs(time).tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm:ss");
};

export default formatTime;
