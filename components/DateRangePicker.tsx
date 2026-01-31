import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

export function DateRangePicker() {
  const [state, setState] = useState<any>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  
  const [focusedRange, setFocusedRange] = useState<any>([0, 0]);

  return (
    <DateRange
      editableDateInputs={false}
      onChange={(item) => setState([item.selection])}
      moveRangeOnFirstSelection={false}
      ranges={state}
      showDateDisplay={false} // Hide the date display input
      showMonthAndYearPickers={false} // Hide month/year pickers initially
      focusedRange={focusedRange}
      onRangeFocusChange={(range) => setFocusedRange(range)}
      className="your-custom-class"
    />
  );
}