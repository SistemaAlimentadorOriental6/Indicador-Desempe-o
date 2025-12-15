// Variantes de animación para las tarjetas

export const variantesTarjeta = {
    initial: { y: 30, opacity: 0, scale: 0.95 },
    animate: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 200,
            damping: 20,
            duration: 0.6,
        },
    },
    hover: {
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" as const },
    },
}
