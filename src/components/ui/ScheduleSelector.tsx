import React from 'react';
import Select from './Select';

interface ScheduleSelectorProps {
    schedule: {
        timing: 'daily' | 'hourly';
        unit: 'minute' | 'hour';
        value: number; 
        limit?: {
            unit: 'hour';
            value: number; 
        };
    };
    onChange: (schedule: ScheduleSelectorProps['schedule']) => void;
}

const timingOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'hourly', label: 'Hourly' },
];

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString(),
    label: `${i.toString().padStart(2, '0')}:00`
}));

const minuteOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i * 5).toString(),
    label: `${(i * 5).toString().padStart(2, '0')}`
}));

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({ schedule, onChange }) => {
    const handleTimingChange = (value: string[]) => {
        const newTiming = value[0] as 'daily' | 'hourly';
        onChange({
            ...schedule,
            timing: newTiming,
            // Reset values when changing timing
            value: 0,
            unit: newTiming === 'daily' ? 'hour' : 'minute',
            limit: newTiming === 'hourly' ? { unit: 'hour', value: 0 } : undefined
        });
    };

    const handleHourChange = (value: string[]) => {
        const hour = parseInt(value[0]);
        if (schedule.timing === 'daily') {
            onChange({
                ...schedule,
                value: hour
            });
        } else {
            onChange({
                ...schedule,
                limit: {
                    unit: 'hour',
                    value: hour
                }
            });
        }
    };

    const handleMinuteChange = (value: string[]) => {
        const minute = parseInt(value[0]);
        onChange({
            ...schedule,
            value: minute
        });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Select
                    id="timing"
                    label="Schedule Type"
                    options={timingOptions}
                    value={[schedule.timing]}
                    onChange={handleTimingChange}
                    multipleSelect={false}
                    placeholder="Select schedule type..."
                />
            </div>

            {schedule.timing === 'daily' ? (
                <div className="space-y-4">
                    <Select
                        id="hours"
                        label="Times of Day"
                        options={hourOptions}
                        value={typeof schedule.value === 'number' ? [schedule.value.toString()] : []}
                        onChange={handleHourChange}
                        multipleSelect={false}
                        placeholder="Select hour..."
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <Select
                        id="hours"
                        label="Hour"
                        options={hourOptions}
                        value={typeof schedule.limit?.value === 'number' ? [schedule.limit.value.toString()] : []}
                        onChange={handleHourChange}
                        multipleSelect={false}
                        placeholder="Select hour..."
                    />
                    <Select
                        id="minutes"
                        label="Minute"
                        options={minuteOptions}
                        value={typeof schedule.value === 'number' ? [schedule.value.toString()] : []}
                        onChange={handleMinuteChange}
                        multipleSelect={false}
                        placeholder="Select minute..."
                    />
                </div>
            )}
        </div>
    );
};

export default ScheduleSelector; 