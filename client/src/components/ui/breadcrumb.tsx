import * as React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  separator?: React.ReactNode;
}

export interface BreadcrumbItemProps extends React.ComponentPropsWithoutRef<"li"> {}

export interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<"a"> {
  href?: string;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ ...props }, ref) => {
    const { children, className, separator = <ChevronRight className="h-4 w-4" />, ...rest } = props;

    return (
      <nav
        ref={ref}
        className={cn("flex flex-wrap text-sm text-muted-foreground", className)}
        aria-label="breadcrumb"
        {...rest}
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return (
                <>
                  {React.cloneElement(child, { ...child.props })}
                  {index < React.Children.count(children) - 1 && (
                    <li className="mx-1 opacity-50">{separator}</li>
                  )}
                </>
              );
            }
            return child;
          })}
        </ol>
      </nav>
    );
  }
);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("inline-flex items-center", className)}
      {...props}
    />
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, href, ...props }, ref) => {
    if (href) {
      return (
        <Link href={href}>
          <a 
            ref={ref} 
            className={cn("inline-flex items-center hover:text-foreground transition-colors", className)} 
            {...props} 
          />
        </Link>
      );
    }
    
    return (
      <span
        className={cn("font-normal", className)}
        aria-current="page"
        {...props}
      />
    );
  }
);
BreadcrumbLink.displayName = "BreadcrumbLink";

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink };