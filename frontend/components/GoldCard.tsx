import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface GoldCardProps {
    data: {
        ipo_name: string;
        parent_company: string;
        action_text?: string;
    };
    className?: string;
}

export function GoldCard({ data, className }: GoldCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl border border-yellow-600/30 bg-gradient-to-b from-yellow-900/40 to-black p-6",
                className
            )}
        >
            {/* Glow Effect */}
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-yellow-500/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-4">
                {/* Badge */}
                <div className="w-fit">
                    <span className="relative inline-flex items-center rounded-full border border-yellow-500/50 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
                        <span className="absolute -left-1 -top-1 h-2 w-2 animate-ping rounded-full bg-yellow-500" />
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-yellow-500" />
                        Upcoming
                    </span>
                </div>

                {/* Content */}
                <div>
                    <h3 className="text-xl font-bold text-white">{data.ipo_name}</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                        Parent Company: <span className="text-zinc-300">{data.parent_company}</span>
                    </p>
                </div>

                {/* Footer */}
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-200/80">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>{data.action_text || "Buy before RHP filing."}</span>
                </div>
            </div>
        </div>
    );
}
