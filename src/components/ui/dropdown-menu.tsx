import * as React from "react"

const DropdownContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({ open: false, setOpen: () => {} });

export const DropdownMenu = ({ children }: any) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger = ({ children, asChild }: any) => {
  const { open, setOpen } = React.useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(prev => !prev);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        if ((children as any).props.onClick) {
          (children as any).props.onClick(e);
        }
        handleClick(e);
      },
      "aria-expanded": open,
    });
  }

  return (
    <button type="button" onClick={handleClick} aria-expanded={open}>
      {children}
    </button>
  );
};

export const DropdownMenuContent = ({ children, align = "center", className = "" }: any) => {
  const { open } = React.useContext(DropdownContext);

  if (!open) return null;

  return (
    <div
      className={`absolute z-50 mt-1 w-56 rounded-xl bg-popover text-popover-foreground shadow-xl border border-border focus:outline-none animate-in fade-in-80 zoom-in-95 ${
        align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left"
      } ${className}`}
    >
      <div className="py-1.5">{children}</div>
    </div>
  );
};

export const DropdownMenuItem = ({ children, onClick, className = "" }: any) => {
  const { setOpen } = React.useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent) => {
    setOpen(false);
    if (onClick) onClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left px-3.5 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground flex items-center transition-colors cursor-pointer rounded-lg mx-1 my-0.5 max-w-[calc(100%-8px)] ${className}`}
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator = ({ className = "" }: any) => (
  <div className={`h-px my-1 bg-border ${className}`} />
);
