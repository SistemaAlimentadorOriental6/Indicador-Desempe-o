export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.1,
            duration: 0.5,
        },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.3 },
    },
}

export const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.4 },
    },
}

export const formVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 24 },
    },
    exit: {
        x: -50,
        opacity: 0,
        transition: { duration: 0.2 },
    },
}

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.15
        }
    }
}
