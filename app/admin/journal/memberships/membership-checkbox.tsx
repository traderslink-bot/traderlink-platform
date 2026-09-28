"use client";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

// FormControlLabel inspects/clones its control; create both on the same side
// of the RSC boundary rather than passing a server-rendered control slot.
export function MembershipCheckbox({ name, value, label, defaultChecked }: {
  name: string;
  value?: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return <FormControlLabel control={<Checkbox key={`${name}:${value ?? ""}:${Boolean(defaultChecked)}`} name={name} value={value} defaultChecked={defaultChecked} />} label={label} />;
}
