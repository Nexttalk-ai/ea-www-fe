
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const timezones = [
  { label: 'LA', zone: 'America/Los_Angeles' },
  { label: 'NY', zone: 'America/New_York' },
  { label: 'IL', zone: 'Asia/Jerusalem' },
];

const MultiTimezoneClock: React.FC = () => {
  const [times, setTimes] = useState<{ [key: string]: string }>({});

  const updateTime = () => {
    const updated = timezones.reduce((acc, { label, zone }) => {
      const time = dayjs().tz(zone).format('hh:mm A');
      acc[label] = `${label} ${time.toLowerCase().replace('am', 'a.m.').replace('pm', 'p.m.')}`;
      return acc;
    }, {} as { [key: string]: string });
    setTimes(updated);
  };

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-[124px] text-[12px] font-normal leading-[13px] text-white text-right whitespace-nowrap gap-[2px]">
      {timezones.map(({ label }) => (
        <div key={label}>{times[label]}</div>
      ))}
    </div>

  );


};

export default MultiTimezoneClock;
