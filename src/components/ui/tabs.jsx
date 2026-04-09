// // import React, { createContext, useContext } from "react";

// // const TabsCtx = createContext({});

// // export const Tabs = ({ value, onValueChange, children, className = "" }) => {
// //   return (
// //     <TabsCtx.Provider value={{ value, onValueChange }}>
// //       <div className={className}>{children}</div>
// //     </TabsCtx.Provider>
// //   );
// // };

// // export const TabsList = ({ children, className = "" }) => <div className={className}>{children}</div>;

// // export const TabsTrigger = ({ value, children, className = "" }) => {
// //   const ctx = useContext(TabsCtx);
// //   const active = ctx.value === value;
// //   return (
// //     <button
// //       className={`${className} px-3 py-2 rounded ${active ? "font-medium" : "text-slate-600"}`}
// //       onClick={() => ctx.onValueChange && ctx.onValueChange(value)}
// //     >
// //       {children}
// //     </button>
// //   );
// // };

// // export const TabsContent = ({ value, children, className = "" }) => {
// //   const ctx = useContext(TabsCtx);
// //   if (ctx.value !== value) return null;
// //   return <div className={className}>{children}</div>;
// // };


// import React, { createContext, useContext } from "react";

// const TabsCtx = createContext({
//   value: "",
//   onValueChange: () => {},
// });

// export const Tabs = ({ defaultValue, value, onValueChange, children, className = "" }) => {
//   const [internalValue, setInternalValue] = React.useState(defaultValue);
  
//   const handleValueChange = (newValue) => {
//     if (onValueChange) {
//       onValueChange(newValue);
//     } else {
//       setInternalValue(newValue);
//     }
//   };

//   const currentValue = value !== undefined ? value : internalValue;

//   return (
//     <TabsCtx.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
//       <div className={className}>{children}</div>
//     </TabsCtx.Provider>
//   );
// };

// export const TabsList = ({ children, className = "" }) => (
//   <div className={`flex items-center ${className}`}>
//     {children}
//   </div>
// );

// export const TabsTrigger = ({ 
//   value, 
//   children, 
//   className = "", 
//   onClick, 
//   ...props 
// }) => {
//   const ctx = useContext(TabsCtx);
//   const active = ctx.value === value;
  
//   const handleClick = (e) => {
//     ctx.onValueChange(value);
//     onClick?.(e);
//   };

//   return (
//     <button
//       {...props}
//       className={`${className} px-4 py-2 text-sm font-medium transition-colors ${
//         active
//           ? "border-b-2 border-blue-500 text-blue-600"
//           : "text-slate-500 hover:text-slate-700"
//       }`}
//       onClick={handleClick}
//       role="tab"
//       aria-selected={active}
//     >
//       {children}
//     </button>
//   );
// };

// export const TabsContent = ({ 
//   value, 
//   children, 
//   className = "",
//   ...props 
// }) => {
//   const ctx = useContext(TabsCtx);
  
//   if (ctx.value !== value) return null;
  
//   return (
//     <div 
//       className={className}
//       role="tabpanel"
//       {...props}
//     >
//       {children}
//     </div>
//   );
// };


import React, { createContext, useContext } from "react";
import { twMerge } from "tailwind-merge"; // Assuming tailwind-merge is installed

const TabsContext = createContext({
  value: "",
  onValueChange: () => {},
});

export const Tabs = React.memo(({ 
  defaultValue, 
  value, 
  onValueChange, 
  children, 
  className = "",
  orientation = "horizontal",
  ...props 
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  
  const handleValueChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const currentValue = value !== undefined ? value : internalValue;

  return (
    <TabsContext.Provider value={{ 
      value: currentValue, 
      onValueChange: handleValueChange,
      orientation
    }}>
      <div 
        className={twMerge(orientation === "vertical" ? "flex" : "", className)} 
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});
Tabs.displayName = "Tabs";

export const TabsList = React.memo(({ 
  children, 
  className = "",
  ...props 
}) => {
  const { orientation } = useContext(TabsContext);
  
  return (
    <div 
      className={twMerge(
        "flex",
        orientation === "vertical" 
          ? "flex-col items-start border-r border-slate-200 pr-4 mr-4" 
          : "items-center border-b border-slate-200",
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
});
TabsList.displayName = "TabsList";

export const TabsTrigger = React.memo(({ 
  value, 
  children, 
  className = "", 
  disabled = false,
  onClick, 
  ...props 
}) => {
  const { value: currentValue, onValueChange, orientation } = useContext(TabsContext);
  const active = currentValue === value;
  
  const handleClick = (e) => {
    if (!disabled) {
      onValueChange(value);
      onClick?.(e);
    }
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={twMerge(
        "px-4 py-2 text-sm font-medium transition-colors",
        active
          ? orientation === "vertical"
            ? "text-blue-600 bg-blue-50/50"
            : "text-blue-600 border-b-2 border-blue-500"
          : "text-slate-500 hover:text-slate-700",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        orientation === "vertical" 
          ? "w-full text-left rounded-lg mb-1" 
          : "mr-2 last:mr-0",
        className
      )}
      onClick={handleClick}
      role="tab"
      aria-selected={active}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.memo(({ 
  value, 
  children, 
  className = "",
  ...props 
}) => {
  const { value: currentValue } = useContext(TabsContext);
  
  if (currentValue !== value) return null;
  
  return (
    <div 
      className={twMerge(currentValue === value ? "block" : "hidden", className)}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      {...props}
    >
      {children}
    </div>
  );
});
TabsContent.displayName = "TabsContent";