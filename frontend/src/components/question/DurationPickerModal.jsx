import React from "react";
import { X } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalCloseButton } from "../Modal";
import Button from "../Button";

const DurationPickerModal = ({
  isOpen,
  onClose,
  selectedHour,
  selectedMinute,
  onHourChange,
  onMinuteChange,
}) => {
  const hourOptions = Array.from({ length: 13 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];

  const presets = [
    { label: "1 Hour", hours: 1, minutes: 0 },
    { label: "1.5 Hours", hours: 1, minutes: 30 },
    { label: "2 Hours", hours: 2, minutes: 0 },
    { label: "3 Hours", hours: 3, minutes: 0 },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
      <ModalHeader className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Set Duration</h3>
          <ModalCloseButton onClose={onClose} />
        </div>
      </ModalHeader>

      <ModalContent className="p-6">
        {/* Duration Selector */}
        <div className="flex items-center justify-center gap-8 mb-6">
          {/* Hours */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-3">Hours</div>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {hourOptions.map((hour) => (
                <button
                  key={hour}
                  onClick={() => onHourChange(hour)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedHour === hour
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {hour}
                </button>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="text-2xl font-bold text-gray-300">:</div>

          {/* Minutes */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-3">
              Minutes
            </div>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {minuteOptions.map((minute) => (
                <button
                  key={minute}
                  onClick={() => onMinuteChange(minute)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedMinute === minute
                      ? "bg-purple-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {minute.toString().padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-600 mb-3">
            Quick Presets
          </div>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onHourChange(preset.hours);
                  onMinuteChange(preset.minutes);
                }}
                className="px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {selectedHour}h {selectedMinute}m
          </div>
          <div className="text-sm text-gray-600">Total Duration</div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button onClick={onClose} className="flex-1 text-gray-900">
            Set Duration
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default DurationPickerModal;
