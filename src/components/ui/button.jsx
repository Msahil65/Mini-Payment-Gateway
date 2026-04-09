// import React from "react";

// export const Button = React.forwardRef(({ children, className = "", variant = "default", size = "default", ...props }, ref) => {
//   const base = "inline-flex items-center justify-center rounded-xl transition-shadow disabled:opacity-60 cursor-pointer";
//   const v = {
//     default: "bg-white border border-slate-200 hover:shadow",
//     outline: "bg-transparent border border-slate-200",
//     ghost: "bg-transparent",
//     destructive: "bg-red-50 border border-red-200",
//     black: "bg-black text-white hover:bg-black/80",
//   }[variant] || "";
//   const s = {
//     default: "px-4 py-2 text-sm",
//     sm: "px-2 py-1 text-xs",
//     icon: "p-2",
//   }[size] || "";
//   return (
//     <button ref={ref} className={`${base} ${v} ${s} ${className}`} {...props}>
//       {children}
//     </button>
//   );
// });







import React from "react";
import { twMerge } from "tailwind-merge"; // Assuming tailwind-merge is installed

export const Button = React.memo(
  React.forwardRef(({ 
    children, 
    className = "", 
    variant = "default", 
    size = "default", 
    isLoading = false,
    ...props 
  }, ref) => {
    const base = "inline-flex items-center justify-center rounded-xl transition-all disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400";
    
    const variants = {
      default: "bg-white border border-slate-200 hover:shadow text-slate-800",
      outline: "bg-transparent border border-slate-200 text-slate-800 hover:bg-slate-50",
      ghost: "bg-transparent text-slate-800 hover:bg-slate-100",
      destructive: "bg-red-50 border border-red-200 text-red-800 hover:bg-red-100",
      black: "bg-black text-white hover:bg-black/80",
      success: "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100",
      warning: "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100",
      primary: "bg-blue-600 text-white hover:bg-blue-700",
    };
    
    const sizes = {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1.5 text-xs",
      lg: "px-6 py-3 text-base",
      icon: "p-2",
    };

    const variantClass = variants[variant] || variants.default;
    const sizeClass = sizes[size] || sizes.default;
    const mergedClassName = twMerge(base, variantClass, sizeClass, className);

    return (
      <button 
        ref={ref} 
        className={mergedClassName}
        disabled={isLoading}
        aria-busy={isLoading ? "true" : undefined}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  })
);

Button.displayName = "Button";