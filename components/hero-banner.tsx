import { Button } from "./ui/button"
import { Card } from "./ui/card"

const HeroBanner = () => {
    return (
        <Card className="relative mb-8 border border-stone-200 bg-white overflow-hidden bg-[repeating-linear-gradient(45deg,hsla(64,83%,54%,0.05)_0px,hsla(64,83%,54%,0.05)_1px,transparent_1px,transparent_11px,hsla(64,83%,54%,0.05)_11px,hsla(64,83%,54%,0.05)_12px,transparent_12px,transparent_32px),repeating-linear-gradient(90deg,hsla(64,83%,54%,0.05)_0px,hsla(64,83%,54%,0.05)_1px,transparent_1px,transparent_11px,hsla(64,83%,54%,0.05)_11px,hsla(64,83%,54%,0.05)_12px,transparent_12px,transparent_32px),repeating-linear-gradient(0deg,hsla(64,83%,54%,0.05)_0px,hsla(64,83%,54%,0.05)_1px,transparent_1px,transparent_11px,hsla(64,83%,54%,0.05)_11px,hsla(64,83%,54%,0.05)_12px,transparent_12px,transparent_32px),repeating-linear-gradient(135deg,hsla(64,83%,54%,0.05)_0px,hsla(64,83%,54%,0.05)_1px,transparent_1px,transparent_11px,hsla(64,83%,54%,0.05)_11px,hsla(64,83%,54%,0.05)_12px,transparent_12px,transparent_32px),linear-gradient(90deg,rgb(41,27,158),rgb(249,77,212))]">
            <div
                className="relative h-64 bg-cover bg-top bg-no-repeat"
            >
                <div className="absolute inset-0"></div>
                <div className="relative z-10 p-8 flex items-center h-full">
                    <div className="max-w-lg">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Open Projects
                        </h2>
                        <p className="text-stone-200 text-lg mb-6 leading-relaxed">
                            Get full visibility into government initiatives. Explore, track, and engage with the projects shaping your community in real-time.
                        </p>
                        <Button
                            size="lg"
                            className="px-6 py-3 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 relative bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-900 text-stone-50 hover:bg-gradient-to-b hover:from-stone-800 hover:to-stone-800 hover:border-stone-900 after:absolute after:inset-0 after:rounded-[inherit] after:box-shadow after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] after:pointer-events-none duration-300 ease-in align-middle select-none font-sans text-center antialiased"
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default HeroBanner;