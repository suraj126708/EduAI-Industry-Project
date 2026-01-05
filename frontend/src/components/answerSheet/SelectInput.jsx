import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
} from "@mui/material";

export const SelectInput = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled = false,
  fullWidth = true,
  size = "medium",
}) => {
  const [menuWidth, setMenuWidth] = React.useState(undefined);
  const formControlRef = React.useRef(null);

  const handleOpen = (event) => {
    if (formControlRef.current) {
      const width = formControlRef.current.offsetWidth;
      setMenuWidth(width);
    }
  };

  return (
    <FormControl
      ref={formControlRef}
      fullWidth={fullWidth}
      error={!!error}
      disabled={disabled}
      size={size}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          minWidth: 90, // base usability
          maxWidth: "100%", // prevent overflow
          width: "auto", // 🔥 dynamic width
          "& .MuiSelect-select": {
            whiteSpace: "nowrap",
            paddingRight: "32px", // space for dropdown icon
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              minWidth: "fit-content",
              maxWidth: 360,
              "& .MuiMenuItem-root": {
                whiteSpace: "nowrap",
              },
            },
          },
        }}
      >
        <MenuItem value="">
          <em>{placeholder || `Select ${label}...`}</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};
