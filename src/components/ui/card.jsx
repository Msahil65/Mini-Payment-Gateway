import React from "react";
import { twMerge } from "tailwind-merge"; // Assuming tailwind-merge is installed

export const Card = React.memo(({ children, className = "" }) => (
  <div
    className={twMerge(
      "bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden",
      className
    )}
  >
    {children}
  </div>
));
Card.displayName = "Card";

export const CardHeader = React.memo(({ children, className = "" }) => (
  <div className={twMerge("px-6 py-4 border-b border-slate-200", className)}>
    {children}
  </div>
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.memo(
  ({ children, className = "", as: Component = "div" }) => (
    <Component
      className={twMerge(
        "text-lg font-semibold text-slate-800 flex items-center gap-2",
        className
      )}
    >
      {children}
    </Component>
  )
);
CardTitle.displayName = "CardTitle";

export const CardContent = React.memo(
  ({ children, className = "", noPadding = false }) => (
    <div
      className={twMerge(
        noPadding ? "" : "p-6",
        "text-slate-700",
        className
      )}
    >
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.memo(({ children, className = "" }) => (
  <div
    className={twMerge(
      "px-6 py-4 border-t border-slate-200 bg-slate-50",
      className
    )}
  >
    {children}
  </div>
));
CardFooter.displayName = "CardFooter";