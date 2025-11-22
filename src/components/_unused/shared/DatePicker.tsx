'use client'
import { useState } from 'react';
import DatePickerComponent from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import { LineIconCalendar } from '@/icons/line-icon';

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function DatePicker() {
  const [value, onChange] = useState<Value>([new Date(), new Date()]);

  return ( 
    <div>
      <DatePickerComponent format="dd-MM-y" onChange={onChange} value={value} className="pr-10 bg-white h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"/>
      <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-1 top-1/2 dark:text-gray-400">
        <LineIconCalendar />
      </span>
    </div>
  );
}