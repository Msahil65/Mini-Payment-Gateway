// import React from "react";

// export const Input = React.forwardRef(({ className = "", ...props }, ref) => {
//   return (
//     <input
//       ref={ref}
//       {...props}
//       className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-sm ${className}`}
//     />
//   );
// });



import React from "react";
import { twMerge } from "tailwind-merge"; // Assuming tailwind-merge is installed

export const Input = React.memo(
  React.forwardRef(({ 
    className = "",
    variant = "default",
    size = "default",
    error,
    disabled,
    readOnly,
    ...props 
  }, ref) => {
    const base = "w-full rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1";
    
    const variants = {
      default: "border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500",
      error: "border border-red-300 bg-white text-slate-800 placeholder-red-400 focus:ring-red-500 focus:border-red-500",
      success: "border border-emerald-300 bg-white text-slate-800 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500",
    };

    const sizes = {
      default: "px-4 py-2.5 text-sm",
      sm: "px-3 py-2 text-xs",
      lg: "px-4 py-3 text-base",
    };

    const stateClasses = disabled 
      ? "bg-slate-50 text-slate-400 cursor-not-allowed" 
      : readOnly 
      ? "bg-slate-50 text-slate-600 cursor-default" 
      : "";

    return (
      <div className="w-full">
        <input
          ref={ref}
          {...props}
          disabled={disabled}
          readOnly={readOnly}
          className={twMerge(base, variants[error ? 'error' : variant], sizes[size], stateClasses, className)}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  })
);
Input.displayName = "Input";

export const Textarea = React.memo(
  React.forwardRef(({ 
    className = "",
    variant = "default",
    size = "default",
    error,
    disabled,
    readOnly,
    ...props 
  }, ref) => {
    const base = "w-full rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[80px]";
    
    const variants = {
      default: "border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500",
      error: "border border-red-300 bg-white text-slate-800 placeholder-red-400 focus:ring-red-500 focus:border-red-500",
      success: "border border-emerald-300 bg-white text-slate-800 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500",
    };

    const sizes = {
      default: "px-4 py-2.5 text-sm",
      sm: "px-3 py-2 text-xs",
      lg: "px-4 py-3 text-base",
    };

    const stateClasses = disabled 
      ? "bg-slate-50 text-slate-400 cursor-not-allowed" 
      : readOnly 
      ? "bg-slate-50 text-slate-600 cursor-default" 
      : "";

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          {...props}
          disabled={disabled}
          readOnly={readOnly}
          className={twMerge(base, variants[error ? 'error' : variant], sizes[size], stateClasses, className)}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  })
);
Textarea.displayName = "Textarea";