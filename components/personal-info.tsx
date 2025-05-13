"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, Mail, Calendar, MapPin, Briefcase, Users, Shield, Eye, EyeOff, Check, ExternalLink } from "lucide-react"

export default function PersonalInfo() {
  // Visibility state for ID number
  const [isIdVisible, setIsIdVisible] = useState(false)
  const [expandedSponsor, setExpandedSponsor] = useState(false)
  const [inViewStates, setInViewStates] = useState([false, false, false, false, false, false, false, false])

  // Refs for each info card
  const refs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ]

  useEffect(() => {
    const observerOptions = {
      rootMargin: "-50px",
      threshold: 0,
    }

    const observers = refs.map((ref, index) => {
      return new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInViewStates((prev) => {
              const next = [...prev]
              next[index] = true
              return next
            })
            observers[index].disconnect() // Disconnect observer after element is in view
          }
        })
      }, observerOptions)
    })

    refs.forEach((ref, index) => {
      if (ref.current) {
        observers[index].observe(ref.current)
      }
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  }

  const childVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
      },
    },
  }

  const personalData = [
    {
      id: "document",
      title: "Documento de identidad",
      value: "Cédula de Ciudadanía",
      icon: <Shield className="h-5 w-5 text-green-600" />,
      detail: "Documento oficial de identificación",
      ref: refs[0],
      inView: inViewStates[0],
      color: "from-green-200/70 to-green-50/80",
      textColor: "text-green-700",
      bgColor: "bg-green-600",
    },
    {
      id: "idNumber",
      title: "Número de cédula",
      value: isIdVisible ? "1089-456-789" : "••••-•••-•••",
      icon: <Shield className="h-5 w-5 text-white" />,
      detail: "Número de identificación personal",
      hasPrivacy: true,
      ref: refs[1],
      inView: inViewStates[1],
      color: "from-emerald-200/70 to-emerald-50/80",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-600",
    },
    {
      id: "birthYear",
      title: "Año de nacimiento",
      value: "1988",
      icon: <Calendar className="h-5 w-5 text-white" />,
      detail: "Edad actual: 35 años",
      ref: refs[2],
      inView: inViewStates[2],
      color: "from-teal-200/70 to-teal-50/80",
      textColor: "text-teal-700",
      bgColor: "bg-teal-600",
    },
    {
      id: "residence",
      title: "Zona de residencia",
      value: "Acevedo",
      icon: <MapPin className="h-5 w-5 text-white" />,
      detail: "Código postal: 28023",
      ref: refs[3],
      inView: inViewStates[3],
      color: "from-green-200/70 to-green-50/80",
      textColor: "text-green-700",
      bgColor: "bg-green-600",
    },
    {
      id: "job",
      title: "Cargo",
      value: "Operador",
      icon: <Briefcase className="h-5 w-5 text-white" />,
      detail: "8 años de experiencia",
      ref: refs[4],
      inView: inViewStates[4],
      color: "from-emerald-200/70 to-emerald-50/80",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-600",
    },
    {
      id: "sponsor",
      title: "Padrino o referente",
      value: "Carlos Mendoza",
      icon: <Users className="h-5 w-5 text-white" />,
      detail: "Mentor deportivo profesional",
      ref: refs[5],
      inView: inViewStates[5],
      color: "from-teal-200/70 to-teal-50/80",
      textColor: "text-teal-700",
      bgColor: "bg-teal-600",
      isExpandable: true,
      expanded: expandedSponsor,
      onExpand: () => setExpandedSponsor(!expandedSponsor),
      sponsorImage: "/doctor-profile.png",
      sponsorDetails: {
        title: "Entrenador de Alto Rendimiento",
        achievements: "Medalla Olímpica 2016",
        experience: "15+ años en entrenamiento deportivo",
        specialty: "Especialista en maratones de montaña",
      },
    },
    {
      id: "email",
      title: "Correo electrónico",
      value: "romis.callejaz@sao6.com.co",
      icon: <Mail className="h-5 w-5 text-white" />,
      detail: "Email principal verificado",
      verified: true,
      ref: refs[6],
      inView: inViewStates[6],
      color: "from-green-200/70 to-green-50/80",
      textColor: "text-green-700",
      bgColor: "bg-green-600",
    },
    {
      id: "phone",
      title: "Teléfono móvil",
      value: "+57 300 123 4567",
      icon: <Phone className="h-5 w-5 text-white" />,
      detail: "Dispositivo personal",
      ref: refs[7],
      inView: inViewStates[7],
      color: "from-emerald-200/70 to-emerald-50/80",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-600",
    },
  ]

  const toggleIdVisibility = () => {
    setIsIdVisible(!isIdVisible)
  }

  // Shimmer animation for cards
  const shimmer = {
    hidden: {
      backgroundPosition: "200% 0",
      opacity: 0.9,
    },
    visible: {
      backgroundPosition: "-200% 0",
      opacity: 1,
      transition: {
        repeat: Number.POSITIVE_INFINITY,
        duration: 2,
        ease: "linear",
      },
    },
  }

  return (
    <div className="pb-20">
      <motion.div
        className="flex items-center gap-2 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-1 w-5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
        <h3 className="text-gray-800 font-semibold text-lg">Información Personal</h3>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-5"
      >
        {personalData.map((item) => (
          <motion.div
            key={item.id}
            ref={item.ref}
            variants={childVariants}
            className={`relative group overflow-hidden rounded-2xl border border-transparent hover:border-${item.bgColor.split("-")[1]}-300/50 bg-gradient-to-br ${item.color} shadow-sm hover:shadow-lg transition-all duration-300`}
            style={{ height: item.id === "sponsor" && expandedSponsor ? "auto" : "" }}
          >
            {/* Glowing effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
              <div
                className={`absolute -top-20 -right-20 w-40 h-40 ${item.bgColor}/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-700`}
              ></div>
              <div
                className={`absolute -bottom-20 -left-20 w-40 h-40 ${item.bgColor}/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-700`}
              ></div>
            </div>

            {/* Background animations */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100"
              variants={shimmer}
              initial="hidden"
              animate={item.inView ? "visible" : "hidden"}
            />

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/5 rounded-full translate-y-8 -translate-x-8" />

            <div className="p-5 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <motion.div
                    className={`${item.bgColor} p-3 rounded-xl shadow-md mr-4 group-hover:shadow-lg transition-all duration-300`}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.icon}
                  </motion.div>
                  <div>
                    <h4 className={`text-sm font-medium ${item.textColor}`}>{item.title}</h4>
                    <div className="flex items-center mt-1">
                      <p className="text-gray-800 font-semibold">{item.value}</p>

                      {item.hasPrivacy && (
                        <motion.button
                          onClick={toggleIdVisibility}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="ml-2 p-1.5 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
                        >
                          {isIdVisible ? (
                            <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 text-gray-500" />
                          )}
                        </motion.button>
                      )}

                      {item.isExpandable && (
                        <motion.button
                          onClick={item.onExpand}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="ml-2 p-1.5 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-teal-500" />
                        </motion.button>
                      )}

                      {item.verified && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.8, type: "spring" }}
                          className="ml-2 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full flex items-center"
                        >
                          <Check className="h-3 w-3 mr-0.5" />
                          <span>Verificado</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details with animation */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    transition: { delay: 0.3, duration: 0.3 },
                  }}
                  className="mt-4 pt-3 border-t border-gray-200/50"
                >
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-xs">{item.detail}</span>
                  </div>

                  {/* Expanded sponsor profile */}
                  {item.id === "sponsor" && expandedSponsor && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.5 }}
                      className="mt-4 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-teal-100"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-emerald-300 blur-md opacity-70 scale-110"></div>
                          <div className="h-20 w-20 rounded-full border-4 border-white overflow-hidden shadow-lg relative z-10">
                            <img
                              src={item.sponsorImage || "/placeholder.svg"}
                              alt="Sponsor"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h4 className="font-bold text-gray-800">Carlos Mendoza</h4>
                          <p className="text-sm text-teal-700">{item.sponsorDetails.title}</p>

                          <div className="mt-2 grid grid-cols-1 gap-1.5">
                            <div className="flex items-center text-xs text-gray-600">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="h-1.5 w-1.5 rounded-full bg-teal-500 mr-1.5"
                              ></motion.div>
                              <span>{item.sponsorDetails.achievements}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: "spring" }}
                                className="h-1.5 w-1.5 rounded-full bg-teal-500 mr-1.5"
                              ></motion.div>
                              <span>{item.sponsorDetails.experience}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="h-1.5 w-1.5 rounded-full bg-teal-500 mr-1.5"
                              ></motion.div>
                              <span>{item.sponsorDetails.specialty}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full mt-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Users className="h-4 w-4" />
                        Ver Perfil Completo
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Decorative accent */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "40%" }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-${item.bgColor.split("-")[1]}-400/40 to-transparent`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-8 flex gap-3"
      >
        <motion.button
          whileHover={{
            scale: 1.02,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
          whileTap={{ scale: 0.98 }}
          className="relative flex-1 py-3.5 rounded-xl font-medium text-white shadow-lg overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 group-hover:scale-105 transition-transform duration-500"></div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
          <div className="relative z-10 flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Editar Información
          </div>
        </motion.button>
      </motion.div>
    </div>
  )
}
