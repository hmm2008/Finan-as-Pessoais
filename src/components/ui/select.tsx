import * as React from "react"
export const Select = ({ value, onValueChange, children, required, className }: any) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)} 
      required={required}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    >
      {React.Children.map(children, (child) => {
        if (child.type === SelectContent) {
          return child.props.children;
        }
        if (child.type === SelectTrigger) {
          return <option value="" disabled>{child.props.children.props?.placeholder || 'Selecione...'}</option>;
        }
        return child;
      })}
    </select>
  )
}
export const SelectTrigger = ({ children, id }: any) => <>{children}</>
export const SelectValue = ({ placeholder }: any) => <>{placeholder}</>
export const SelectContent = ({ children }: any) => <>{children}</>
export const SelectItem = ({ value, children, style, className }: any) => <option value={value} style={style} className={className}>{children}</option>
