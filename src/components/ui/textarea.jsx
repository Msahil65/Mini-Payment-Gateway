// import React from "react";

// export const Textarea = React.forwardRef(({ className = "", ...props }, ref) => {
//   return <textarea ref={ref} {...props} className={`w-full border rounded-xl p-3 text-sm ${className}`} />;
// });


import React from "react";
import { twMerge } from "tailwind-merge"; // Assuming tailwind-merge is installed

export const Textarea = React.memo(
  React.forwardRef(({ 
    className = "",
    disabled = false,
    error = false,
    ...props 
  }, ref) => {
    const base = "w-full border rounded-xl p-3 text-sm bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    const errorClass = error ? "border-red-500" : "border-slate-200";
    const disabledClass = disabled ? "bg-slate-50 cursor-not-allowed" : "";

    return (
      <textarea 
        ref={ref}
        {...props}
        disabled={disabled}
        className={twMerge(base, errorClass, disabledClass, className)}
      />
    );
  })
);

Textarea.displayName = "Textarea";