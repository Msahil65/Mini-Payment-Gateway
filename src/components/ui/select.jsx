// // src/components/ui/select.jsx
// import React, { useState, useRef, useEffect } from "react";
// import { ChevronDown } from "lucide-react";

// export const Select = ({ value, onValueChange, children, className = "" }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const selectRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (selectRef.current && !selectRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const clonedChildren = React.Children.map(children, (child) => {
//     if (!React.isValidElement(child)) return child;
//     return React.cloneElement(child, { value, onValueChange, isOpen, setIsOpen });
//   });

//   return (
//     <div className={`relative ${className}`} ref={selectRef}>
//       {clonedChildren}
//     </div>
//   );
// };

// export const SelectTrigger = ({ children, setIsOpen, isOpen }) => (
//   <button
//     type="button"
//     onClick={() => setIsOpen(!isOpen)}
//     className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
//   >
//     {children}
//     <ChevronDown className="h-4 w-4 opacity-50" />
//   </button>
// );

// export const SelectValue = ({ value, placeholder, children }) => (
//   <span className="truncate">
//     {value || children || placeholder}
//   </span>
// );

// export const SelectContent = ({ children, isOpen, setIsOpen, onValueChange }) => {
//   if (!isOpen) return null;

//   const items = React.Children.map(children, (child) => {
//     if (!React.isValidElement(child)) return child;
//     return React.cloneElement(child, { onValueChange, setIsOpen });
//   });

//   return (
//     <div className="absolute z-50 mt-1 w-full min-w-[8rem] rounded-md border border-slate-200 bg-white shadow-md">
//       {items}
//     </div>
//   );
// };

// export const SelectItem = ({ value, children, onValueChange, setIsOpen }) => (
//   <div
//     className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100"
//     onClick={() => {
//       onValueChange(value);
//       setIsOpen(false);
//     }}
//   >
//     {children}
//   </div>
// );



// Type to filter feature

// src/components/ui/select.jsx
// import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
// import { ChevronDown } from "lucide-react";
// import { twMerge } from "tailwind-merge";

// const SelectContext = createContext();

// export const Select = React.memo(({ value, onValueChange, children, className = "" }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [filter, setFilter] = useState(""); // State for filtering input
//   const selectRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (selectRef.current && !selectRef.current.contains(event.target)) {
//         setIsOpen(false);
//         setFilter(""); // Clear filter on close
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const displayText = useMemo(() => {
//     let contentChildren = [];
//     React.Children.forEach(children, (child) => {
//       if (child.type === SelectContent) {
//         contentChildren = React.Children.toArray(child.props.children);
//       }
//     });
//     const selectedItem = contentChildren.find((item) => item.props.value === value);
//     return selectedItem ? selectedItem.props.children : undefined;
//   }, [children, value]);

//   return (
//     <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, filter, setFilter, displayText }}>
//       <div className={twMerge("relative", className)} ref={selectRef}>
//         {children}
//       </div>
//     </SelectContext.Provider>
//   );
// });
// Select.displayName = "Select";

// export const SelectTrigger = React.memo(({ children, className = "" }) => {
//   const { setIsOpen, isOpen, setFilter } = useContext(SelectContext);
//   return (
//     <button
//       type="button"
//       onClick={() => {
//         setIsOpen(!isOpen);
//         if (!isOpen) setFilter(""); // Clear filter when opening
//       }}
//       className={twMerge(
//         "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
//         className
//       )}
//     >
//       {children}
//       <ChevronDown className="h-4 w-4 opacity-50" />
//     </button>
//   );
// });
// SelectTrigger.displayName = "SelectTrigger";

// export const SelectValue = React.memo(({ placeholder, className = "" }) => {
//   const { displayText, value } = useContext(SelectContext);
//   return (
//     <span className={twMerge("truncate", className)}>
//       {displayText || (value ? value : placeholder)}
//     </span>
//   );
// });
// SelectValue.displayName = "SelectValue";

// export const SelectContent = React.memo(({ children, className = "" }) => {
//   const { isOpen, setIsOpen, onValueChange, filter } = useContext(SelectContext);
//   if (!isOpen) return null;

//   const filteredChildren = React.Children.toArray(children).filter((child) =>
//     child.props.children?.toString().toLowerCase().includes(filter.toLowerCase())
//   );

//   return (
//     <div
//       className={twMerge(
//         "absolute z-50 mt-1 w-full min-w-[8rem] rounded-md border border-slate-200 bg-white shadow-md",
//         className
//       )}
//     >
//       <div className="px-3 py-2">
//         <input
//           type="text"
//           value={filter}
//           onChange={(e) => setFilter(e.target.value)}
//           placeholder="Type to filter..."
//           className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
//           autoFocus
//         />
//       </div>
//       {filteredChildren.length > 0 ? (
//         filteredChildren.map((child) =>
//           React.isValidElement(child)
//             ? React.cloneElement(child, {
//                 onSelect: (val) => {
//                   onValueChange(val);
//                   setIsOpen(false);
//                   setFilter("");
//                 },
//               })
//             : child
//         )
//       ) : (
//         <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
//       )}
//     </div>
//   );
// });
// SelectContent.displayName = "SelectContent";

// export const SelectItem = React.memo(({ value, children, className = "", onSelect }) => (
//   <div
//     className={twMerge("cursor-pointer px-3 py-2 text-sm hover:bg-slate-100", className)}
//     onClick={() => onSelect(value)}
//   >
//     {children}
//   </div>
// ));
// SelectItem.displayName = "SelectItem";








// Type to filter code part 2

// import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
// import { ChevronDown } from "lucide-react";
// import { twMerge } from "tailwind-merge";

// const SelectContext = createContext();

// export const Select = React.memo(({ value, onValueChange, children, className = "", showFilter = false }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [filter, setFilter] = useState(""); // State for filtering input
//   const selectRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (selectRef.current && !selectRef.current.contains(event.target)) {
//         setIsOpen(false);
//         setFilter(""); // Clear filter on close
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const displayText = useMemo(() => {
//     let contentChildren = [];
//     React.Children.forEach(children, (child) => {
//       if (child.type === SelectContent) {
//         contentChildren = React.Children.toArray(child.props.children);
//       }
//     });
//     const selectedItem = contentChildren.find((item) => item.props.value === value);
//     return selectedItem ? selectedItem.props.children : undefined;
//   }, [children, value]);

//   return (
//     <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, filter, setFilter, displayText, showFilter }}>
//       <div className={twMerge("relative", className)} ref={selectRef}>
//         {children}
//       </div>
//     </SelectContext.Provider>
//   );
// });
// Select.displayName = "Select";

// export const SelectTrigger = React.memo(({ children, className = "" }) => {
//   const { setIsOpen, isOpen, setFilter } = useContext(SelectContext);
//   return (
//     <button
//       type="button"
//       onClick={() => {
//         setIsOpen(!isOpen);
//         if (!isOpen) setFilter(""); // Clear filter when opening
//       }}
//       className={twMerge(
//         "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
//         className
//       )}
//     >
//       {children}
//       <ChevronDown className="h-4 w-4 opacity-50" />
//     </button>
//   );
// });
// SelectTrigger.displayName = "SelectTrigger";

// export const SelectValue = React.memo(({ placeholder, className = "" }) => {
//   const { displayText, value } = useContext(SelectContext);
//   return (
//     <span className={twMerge("truncate", className)}>
//       {displayText || (value ? value : placeholder)}
//     </span>
//   );
// });
// SelectValue.displayName = "SelectValue";

// export const SelectContent = React.memo(({ children, className = "" }) => {
//   const { isOpen, setIsOpen, onValueChange, filter, setFilter, showFilter } = useContext(SelectContext);
//   if (!isOpen) return null;

//   const filteredChildren = React.Children.toArray(children).filter((child) =>
//     child.props.children?.toString().toLowerCase().includes(filter.toLowerCase())
//   );

//   return (
//     <div
//       className={twMerge(
//         "absolute z-50 mt-1 w-full min-w-[8rem] rounded-md border border-slate-200 bg-white shadow-md",
//         className
//       )}
//     >
//       {showFilter && (
//         <div className="px-3 py-2">
//           <input
//             type="text"
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//             placeholder="Type to filter..."
//             className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
//             autoFocus
//           />
//         </div>
//       )}
//       {filteredChildren.length > 0 ? (
//         filteredChildren.map((child) =>
//           React.isValidElement(child)
//             ? React.cloneElement(child, {
//                 onSelect: (val) => {
//                   onValueChange(val);
//                   setIsOpen(false);
//                   setFilter("");
//                 },
//               })
//             : child
//         )
//       ) : (
//         <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
//       )}
//     </div>
//   );
// });
// SelectContent.displayName = "SelectContent";

// export const SelectItem = React.memo(({ value, children, className = "", onSelect }) => (
//   <div
//     className={twMerge("cursor-pointer px-3 py-2 text-sm hover:bg-slate-100", className)}
//     onClick={() => onSelect(value)}
//   >
//     {children}
//   </div>
// ));
// SelectItem.displayName = "SelectItem";





// import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
// import { ChevronDown } from "lucide-react";
// import { twMerge } from "tailwind-merge";

// const SelectContext = createContext();

// export const Select = React.memo(({ value, onValueChange, children, className = "", showFilter = false }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [filter, setFilter] = useState("");
//   const [focusedIndex, setFocusedIndex] = useState(-1);
//   const selectRef = useRef(null);
//   const itemsRef = useRef([]);

//   const isOpenRef = useRef(isOpen);
//   const filterRef = useRef(filter);
//   const focusedIndexRef = useRef(focusedIndex);
//   const onValueChangeRef = useRef(onValueChange);
//   const childrenRef = useRef(children);

//   useEffect(() => {
//     isOpenRef.current = isOpen;
//   }, [isOpen]);

//   useEffect(() => {
//     filterRef.current = filter;
//   }, [filter]);

//   useEffect(() => {
//     focusedIndexRef.current = focusedIndex;
//   }, [focusedIndex]);

//   useEffect(() => {
//     onValueChangeRef.current = onValueChange;
//   }, [onValueChange]);

//   useEffect(() => {
//     childrenRef.current = children;
//   }, [children]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (selectRef.current && !selectRef.current.contains(event.target)) {
//         setIsOpen(false);
//         setFilter("");
//         setFocusedIndex(-1);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       if (!isOpenRef.current) return;

//       const filteredChildren = React.Children.toArray(childrenRef.current).find(
//         (child) => child.type === SelectContent
//       )?.props.children || [];
//       const validItems = React.Children.toArray(filteredChildren).filter((child) =>
//         child.props.children?.toString().toLowerCase().includes(filterRef.current.toLowerCase())
//       );

//       if (event.key === "ArrowDown") {
//         event.preventDefault();
//         setFocusedIndex((prev) => {
//           const nextIndex = prev < validItems.length - 1 ? prev + 1 : prev;
//           itemsRef.current[nextIndex]?.scrollIntoView({ block: "nearest" });
//           return nextIndex;
//         });
//       } else if (event.key === "ArrowUp") {
//         event.preventDefault();
//         setFocusedIndex((prev) => {
//           const nextIndex = prev > 0 ? prev - 1 : 0;
//           itemsRef.current[nextIndex]?.scrollIntoView({ block: "nearest" });
//           return nextIndex;
//         });
//       } else if (event.key === "Enter" && focusedIndexRef.current >= 0) {
//         event.preventDefault();
//         const selectedItem = validItems[focusedIndexRef.current];
//         if (selectedItem) {
//           onValueChangeRef.current(selectedItem.props.value);
//           setIsOpen(false);
//           setFilter("");
//           setFocusedIndex(-1);
//         }
//       } else if (event.key === "Escape") {
//         setIsOpen(false);
//         setFilter("");
//         setFocusedIndex(-1);
//       }
//     };

//     document.addEventListener("keydown", handleKeyDown);
//     return () => document.removeEventListener("keydown", handleKeyDown);
//   }, []);  // Empty dependency array

//   // Set initial focused index to the selected value when opening
//   useEffect(() => {
//     if (isOpen) {
//       let initialIndex = -1;
//       let contentChildren = [];
//       React.Children.forEach(children, (child) => {
//         if (child.type === SelectContent) {
//           contentChildren = React.Children.toArray(child.props.children);
//         }
//       });
//       contentChildren.forEach((item, idx) => {
//         if (item.props.value === value) {
//           initialIndex = idx;
//         }
//       });
//       setFocusedIndex(initialIndex !== -1 ? initialIndex : 0);
//       // Scroll to initial focused item
//       setTimeout(() => {
//         itemsRef.current[initialIndex !== -1 ? initialIndex : 0]?.scrollIntoView({ block: "nearest" });
//       }, 0);
//     }
//   }, [isOpen, children, value]);

//   const displayText = useMemo(() => {
//     let contentChildren = [];
//     React.Children.forEach(children, (child) => {
//       if (child.type === SelectContent) {
//         contentChildren = React.Children.toArray(child.props.children);
//       }
//     });
//     const selectedItem = contentChildren.find((item) => item.props.value === value);
//     return selectedItem ? selectedItem.props.children : undefined;
//   }, [children, value]);

//   return (
//     <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, filter, setFilter, displayText, showFilter, focusedIndex, itemsRef }}>
//       <div className={twMerge("relative", className)} ref={selectRef}>
//         {children}
//       </div>
//     </SelectContext.Provider>
//   );
// });
// Select.displayName = "Select";

// export const SelectTrigger = React.memo(({ children, className = "" }) => {
//   const { setIsOpen, isOpen, setFilter } = useContext(SelectContext);
//   return (
//     <button
//       type="button"
//       onClick={() => {
//         setIsOpen(!isOpen);
//         if (!isOpen) setFilter("");
//         // focusedIndex is set in useEffect
//       }}
//       className={twMerge(
//         "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
//         className
//       )}
//     >
//       {children}
//       <ChevronDown className="h-4 w-4 opacity-50" />
//     </button>
//   );
// });
// SelectTrigger.displayName = "SelectTrigger";

// export const SelectValue = React.memo(({ placeholder, className = "" }) => {
//   const { displayText, value } = useContext(SelectContext);
//   return (
//     <span className={twMerge("truncate", className)}>
//       {displayText || (value ? value : placeholder)}
//     </span>
//   );
// });
// SelectValue.displayName = "SelectValue";

// export const SelectContent = React.memo(({ children, className = "" }) => {
//   const { isOpen, setIsOpen, onValueChange, filter, setFilter, showFilter, focusedIndex, itemsRef } = useContext(SelectContext);
//   if (!isOpen) return null;

//   const filteredChildren = React.Children.toArray(children).filter((child) =>
//     child.props.children?.toString().toLowerCase().includes(filter.toLowerCase())
//   );

//   // Reset itemsRef before assigning new refs
//   itemsRef.current = [];

//   return (
//     <div
//       className={twMerge(
//         "absolute z-50 mt-1 w-full min-w-[8rem] rounded-md border border-slate-200 bg-white shadow-md",
//         className
//       )}
//     >
//       {showFilter && (
//         <div className="px-3 py-2 sticky top-0 bg-white z-10">
//           <input
//             type="text"
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//             placeholder="Type to filter..."
//             className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
//             autoFocus
//           />
//         </div>
//       )}
//       <div className="max-h-60 overflow-y-auto">
//         {filteredChildren.length > 0 ? (
//           filteredChildren.map((child, index) =>
//             React.isValidElement(child)
//               ? React.cloneElement(child, {
//                   key: index,
//                   onSelect: (val) => {
//                     onValueChange(val);
//                     setIsOpen(false);
//                     setFilter("");
//                   },
//                   ref: (el) => (itemsRef.current[index] = el),
//                   index,
//                 })
//               : child
//           )
//         ) : (
//           <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
//         )}
//       </div>
//     </div>
//   );
// });
// SelectContent.displayName = "SelectContent";

// export const SelectItem = React.memo(
//   React.forwardRef(({ value, children, className = "", onSelect, index }, ref) => {
//     const { focusedIndex: contextFocusedIndex } = useContext(SelectContext);
//     const isFocused = index === contextFocusedIndex;

//     return (
//       <div
//         ref={ref}
//         className={twMerge(
//           "cursor-pointer px-3 py-2 text-sm hover:bg-slate-100",
//           isFocused && "bg-slate-100",
//           className
//         )}
//         onClick={() => onSelect(value)}
//       >
//         {children}
//       </div>
//     );
//   })
// );
// SelectItem.displayName = "SelectItem";





// Type to filter code 


import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";

const SelectContext = createContext();

export const Select = React.memo(({ value, onValueChange, children, className = "", showFilter = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef(null);
  const itemsRef = useRef([]);

  const isOpenRef = useRef(isOpen);
  const filterRef = useRef(filter);
  const focusedIndexRef = useRef(focusedIndex);
  const onValueChangeRef = useRef(onValueChange);
  const childrenRef = useRef(children);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  useEffect(() => {
    childrenRef.current = children;
  }, [children]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setFilter("");
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpenRef.current) return;

      const filteredChildren = React.Children.toArray(childrenRef.current).find(
        (child) => child.type === SelectContent
      )?.props.children || [];
      const validItems = React.Children.toArray(filteredChildren).filter((child) =>
        child.props.children?.toString().toLowerCase().includes(filterRef.current.toLowerCase())
      );

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => {
          const nextIndex = prev < validItems.length - 1 ? prev + 1 : prev;
          itemsRef.current[nextIndex]?.scrollIntoView({ block: "nearest" });
          return nextIndex;
        });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) => {
          const nextIndex = prev > 0 ? prev - 1 : 0;
          itemsRef.current[nextIndex]?.scrollIntoView({ block: "nearest" });
          return nextIndex;
        });
      } else if (event.key === "Enter" && focusedIndexRef.current >= 0) {
        event.preventDefault();
        const selectedItem = validItems[focusedIndexRef.current];
        if (selectedItem) {
          onValueChangeRef.current(selectedItem.props.value);
          setIsOpen(false);
          setFilter("");
          setFocusedIndex(-1);
        }
      } else if (event.key === "Escape") {
        setIsOpen(false);
        setFilter("");
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);  // Empty dependency array

  // Set initial focused index to the selected value when opening
  useEffect(() => {
    if (isOpen) {
      let initialIndex = -1;
      let contentChildren = [];
      React.Children.forEach(children, (child) => {
        if (child.type === SelectContent) {
          contentChildren = React.Children.toArray(child.props.children);
        }
      });
      contentChildren.forEach((item, idx) => {
        if (item.props.value === value) {
          initialIndex = idx;
        }
      });
      setFocusedIndex(initialIndex !== -1 ? initialIndex : 0);
      // Scroll to initial focused item
      setTimeout(() => {
        itemsRef.current[initialIndex !== -1 ? initialIndex : 0]?.scrollIntoView({ block: "nearest" });
      }, 0);
    }
  }, [isOpen, children, value]);

  const displayText = useMemo(() => {
    let contentChildren = [];
    React.Children.forEach(children, (child) => {
      if (child.type === SelectContent) {
        contentChildren = React.Children.toArray(child.props.children);
      }
    });
    const selectedItem = contentChildren.find((item) => item.props.value === value);
    return selectedItem ? selectedItem.props.children : undefined;
  }, [children, value]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, filter, setFilter, displayText, showFilter, focusedIndex, itemsRef }}>
      <div className={twMerge("relative", className)} ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
});
Select.displayName = "Select";

export const SelectTrigger = React.memo(({ children, className = "" }) => {
  const { setIsOpen, isOpen, setFilter } = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => {
        setIsOpen(!isOpen);
        if (!isOpen) setFilter("");
        // focusedIndex is set in useEffect
      }}
      className={twMerge(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = React.memo(({ placeholder, className = "" }) => {
  const { displayText, value } = useContext(SelectContext);
  return (
    <span className={twMerge("truncate", className)}>
      {displayText || (value ? value : placeholder)}
    </span>
  );
});
SelectValue.displayName = "SelectValue";

export const SelectContent = React.memo(({ children, className = "" }) => {
  const { isOpen, setIsOpen, onValueChange, filter, setFilter, showFilter, focusedIndex, itemsRef } = useContext(SelectContext);
  if (!isOpen) return null;

  const filteredChildren = React.Children.toArray(children).filter((child) =>
    child.props.children?.toString().toLowerCase().includes(filter.toLowerCase())
  );

  // Reset itemsRef before assigning new refs
  itemsRef.current = [];

  return (
    <div
      className={twMerge(
        "absolute z-50 mt-1 w-full min-w-[8rem] rounded-md border border-slate-200 bg-white shadow-md",
        className
      )}
    >
      {showFilter && (
        <div className="px-3 py-2 sticky top-0 bg-white z-10">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Type to filter..."
            className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>
      )}
      <div className="max-h-60 overflow-y-auto">
        {filteredChildren.length > 0 ? (
          filteredChildren.map((child, index) =>
            React.isValidElement(child)
              ? React.cloneElement(child, {
                  key: index,
                  onSelect: (val) => {
                    onValueChange(val);
                    setIsOpen(false);
                    setFilter("");
                  },
                  ref: (el) => (itemsRef.current[index] = el),
                  index,
                })
              : child
          )
        ) : (
          <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
        )}
      </div>
    </div>
  );
});
SelectContent.displayName = "SelectContent";

export const SelectItem = React.memo(
  React.forwardRef(({ value, children, className = "", onSelect, index }, ref) => {
    const { focusedIndex: contextFocusedIndex } = useContext(SelectContext);
    const isFocused = index === contextFocusedIndex;

    return (
      <div
        ref={ref}
        className={twMerge(
          "cursor-pointer px-3 py-2 text-sm hover:bg-slate-100",
          isFocused && "bg-slate-100",
          className
        )}
        onClick={() => onSelect(value)}
      >
        {children}
      </div>
    );
  })
);
SelectItem.displayName = "SelectItem";









