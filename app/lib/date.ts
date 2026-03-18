import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Shanghai');

export const TZ = 'Asia/Shanghai';

export const nowInTz = () => dayjs().tz(TZ);

export const toTz = (input?: string) =>
  input ? dayjs.tz(input, TZ) : nowInTz();

export const formatDate = (input?: string) => toTz(input).format('YYYY-MM-DD');
