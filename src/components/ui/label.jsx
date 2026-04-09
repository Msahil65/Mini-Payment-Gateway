// import React from "react";

// export const Label = ({ children, className = "" }) => {
//   return <label className={`block text-sm font-medium ${className}`}>{children}</label>;
// };


import React from "react";

export const Label = ({ 
  children, 
  className = "", 
  htmlFor,
  required = false,
  disabled = false,
  size = "default",
  error = false
}) => {
  const sizeClasses = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base"
  };

  const stateClasses = disabled 
    ? "text-slate-400 dark:text-slate-500" 
    : error 
    ? "text-red-600 dark:text-red-400" 
    : "text-slate-700 dark:text-slate-300";

  return (
    <label 
      htmlFor={htmlFor}
      className={`block font-medium mb-1 ${sizeClasses[size]} ${stateClasses} ${className}`}
    >
      {children}
      {required && (
        <span className="text-red-500 dark:text-red-400 ml-1">*</span>
      )}
    </label>
  );
};

export const LabelDescription = ({ 
  children, 
  className = "",
  error = false
}) => {
  return (
    <span className={`block mt-1 text-xs ${
      error 
        ? "text-red-600 dark:text-red-400" 
        : "text-slate-500 dark:text-slate-400"
    } ${className}`}>
      {children}
    </span>
  );
};