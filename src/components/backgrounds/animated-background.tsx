"use client";

import { Suspense, lazy } from "react";

const Strands = lazy(() => import("./Strands"));
const Silk = lazy(() => import("./Silk"));

function BackgroundFallback() {
    return (
        <div
            className="fixed inset-0 -z-10"
            style={{
                background:
                    "radial-gradient(at 0% 0%, rgba(25,14,133,0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(0,224,255,0.06) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(207,0,255,0.05) 0px, transparent 50%), #F0EFF5",
            }}
        />
    );
}

export function AnimatedBackground({ variant = "strands" }: { variant?: "silk" | "strands" }) {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <Suspense fallback={<BackgroundFallback />}>
                {variant === "silk" ? (
                    <Silk speed={3} scale={1.2} color="#190E85" noiseIntensity={1.2} rotation={0.3} />
                ) : (
                    <Strands
                        colors={["#190E85", "#00E0FF", "#CF00FF", "#03CF94"]}
                        count={6}
                        speed={0.4}
                        amplitude={0.5}
                        waviness={2}
                        thickness={0.5}
                        glow={2}
                        taper={4}
                        spread={2}
                        intensity={0.5}
                        saturation={1.3}
                        opacity={0.35}
                        scale={1.8}
                    />
                )}
            </Suspense>
        </div>
    );
}