interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({ 
  date, 
  onDateChange, 
  placeholder = "YYYY-MM-DD",
  className = "",
  disabled = false
}: DatePickerProps) {
  // Convert Date to string format for HTML input
  const dateValue = date ? date.toISOString().split('T')[0] : '';
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const newDate = new Date(value);
      // Set time to noon to avoid timezone issues
      newDate.setHours(12, 0, 0, 0);
      onDateChange(newDate);
    } else {
      onDateChange(undefined);
    }
  };
  
  return (
    <input
      type="date"
      className={`h-9 bg-background border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm ${className}`}
      value={dateValue}
      onChange={handleDateChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}