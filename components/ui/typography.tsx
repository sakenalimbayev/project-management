import { cn } from "@/lib/utils"
import { ReactNode } from "react"

type TypographyProps = {
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'blockquote' | 'code' | 'lead' | 'large' | 'small' | 'muted'
    children: ReactNode
    className?: string
}

export function Typography({ variant = 'p', children, className }: TypographyProps) {
    const variants = {
        h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
        h4: "scroll-m-20 text-xl font-semibold tracking-tight",
        p: "leading-7 [&:not(:first-child)]:mt-6",
        blockquote: "mt-6 border-l-2 pl-6 italic",
        code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        lead: "text-xl text-muted-foreground",
        large: "text-lg font-semibold",
        small: "text-sm font-medium leading-none",
        muted: "text-sm text-muted-foreground",
    }

    // Determine the HTML tag based on the variant
    const Component = (variant.startsWith('h') ? variant : variant === 'blockquote' ? 'blockquote' : variant === 'code' ? 'code' : 'p') as any

    return (
        <Component className={cn(variants[variant], className)}>
            {children}
        </Component>
    )
}