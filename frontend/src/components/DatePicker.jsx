import React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function DatePicker({ selected, onSelect, noDate, onNoDateChange }) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleDateSelect = (date) => {
    onSelect(date)
    setIsOpen(false)
    if (noDate) {
      onNoDateChange(false)
    }
  }

  const handleNoDateChange = (e) => {
    const checked = e.target.checked
    onNoDateChange(checked)
    if (checked) {
      onSelect(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => !noDate && setIsOpen(!isOpen)}
          disabled={noDate}
          className={`flex items-center gap-2 px-4 py-2 rounded border transition-colors ${
            noDate
              ? 'border-gray-700 text-gray-600 cursor-not-allowed'
              : 'border-accent text-text hover:bg-accent/10'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>
            {selected && !noDate
              ? format(selected, 'EEE, MMM d')
              : 'Select date'}
          </span>
        </button>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={noDate}
            onChange={handleNoDateChange}
            className="w-4 h-4 accent-accent"
          />
          <span>No Date</span>
        </label>
      </div>

      {isOpen && !noDate && (
        <div className="absolute z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDateSelect}
            className="rdp-custom"
          />
        </div>
      )}

      <style jsx global>{`
        .rdp-custom {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #7c3aed;
          --rdp-background-color: #7c3aed20;
          color: #f5f5f0;
        }
        .rdp-custom .rdp-button:hover:not([disabled]) {
          background-color: #7c3aed40;
        }
        .rdp-custom .rdp-day_selected {
          background-color: #7c3aed;
          color: white;
        }
        .rdp-custom .rdp-head_cell {
          color: #9ca3af;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
