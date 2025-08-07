// TODO: Install flatpickr if advanced date picker functionality is needed
// Component stubbed out to use native HTML date input

import Label from "./Label";
import { LuCalendar as CalenderIcon } from "react-icons/lu";

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: (selectedDates: Date[], dateStr: string) => void;
  defaultDate?: string | Date;
  label?: string;
  placeholder?: string;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
}: PropsType) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && e.target.value) {
      const date = new Date(e.target.value);
      onChange([date], e.target.value);
    }
  };

  const getInputType = () => {
    if (mode === "time") return "time";
    if (mode === "range") return "date"; // HTML doesn't support range, fallback to date
    return "date";
  };

  const getDefaultValue = () => {
    if (!defaultDate) return "";
    if (typeof defaultDate === "string") return defaultDate;
    return defaultDate.toISOString().split("T")[0];
  };

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          type={getInputType()}
          placeholder={placeholder}
          defaultValue={getDefaultValue()}
          onChange={handleChange}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
