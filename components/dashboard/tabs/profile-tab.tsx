"use client"
import { motion } from "framer-motion"
import { User, FileText, Settings, Bell, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface ProfileTabContentProps {
  user: any
  openProfile: () => void
  kilometersTotal: number
  bonusesAvailable: number
  lastMonthName: string
  lastMonthYear: number
  cardVariants: any
  formatCurrency: (amount: number) => string
}

export default function ProfileTabContent({
  user,
  openProfile,
  kilometersTotal,
  bonusesAvailable,
  lastMonthName,
  lastMonthYear,
  cardVariants,
  formatCurrency,
}: ProfileTabContentProps) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Profile Information Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-32 relative">
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="px-6 pb-6 relative">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md absolute -top-12 left-6">
            <AvatarImage src="/abstract-profile.png" alt={user?.nombre || "Usuario"} />
            <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xl">
              {user?.nombre?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="pt-16 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{user?.nombre || "FRANCISCO JAVIER SOTO GOMEZ"}</h2>
              <p className="text-gray-500">Operador de Transporte</p>
            </div>

            <Button onClick={openProfile} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <User className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionCard
          icon={FileText}
          title="Documentos"
          description="Ver documentos personales"
          onClick={() => console.log("Documentos")}
        />

        <QuickActionCard
          icon={Calendar}
          title="Calendario"
          description="Ver programación"
          onClick={() => console.log("Calendario")}
        />

        <QuickActionCard
          icon={Bell}
          title="Notificaciones"
          description="Configurar alertas"
          onClick={() => console.log("Notificaciones")}
        />

        <QuickActionCard
          icon={Settings}
          title="Configuración"
          description="Ajustes de cuenta"
          onClick={() => console.log("Configuración")}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Últimas acciones realizadas en la plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActivityItem
            title="Ruta completada"
            description="Completaste la ruta #1045 - Bogotá Norte"
            time="Hoy, 10:30 AM"
          />

          <ActivityItem
            title="Bono acreditado"
            description={`Se acreditó tu bono de ${formatCurrency(bonusesAvailable)}`}
            time="Ayer, 3:15 PM"
          />

          <ActivityItem
            title="Actualización de perfil"
            description="Actualizaste tu información de contacto"
            time="15 Jun, 2:45 PM"
          />

          <ActivityItem
            title="Nuevo logro desbloqueado"
            description="Alcanzaste 10,000 kilómetros recorridos"
            time="10 Jun, 9:20 AM"
          />
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Ver todo el historial
          </Button>
        </CardFooter>
      </Card>

      {/* Upcoming Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Programaciones</CardTitle>
          <CardDescription>Rutas programadas para los próximos días</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScheduleItem route="Ruta #1046 - Bogotá Sur" date="Mañana" time="08:00 AM - 04:00 PM" />

          <ScheduleItem route="Ruta #1047 - Bogotá Occidente" date="20 Jun, 2023" time="09:00 AM - 05:00 PM" />

          <ScheduleItem route="Ruta #1048 - Bogotá Centro" date="22 Jun, 2023" time="07:30 AM - 03:30 PM" />
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Ver calendario completo
          </Button>
        </CardFooter>
      </Card>

      {/* Personal Info Button */}
      <motion.button
        whileHover={{
          scale: 1.02,
          boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2), 0 10px 10px -5px rgba(16, 185, 129, 0.1)",
        }}
        whileTap={{ scale: 0.98 }}
        onClick={openProfile}
        className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 text-white py-4 rounded-xl font-medium shadow-md flex items-center justify-center gap-3 relative overflow-hidden group"
      >
        {/* Enhanced button animations and effects */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <motion.div
          className="absolute inset-0 bg-white/10"
          animate={{
            x: ["-100%", "100%"],
            opacity: [0, 0.2, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 2,
          }}
        />
        <User className="h-5 w-5 relative z-10" />
        <span className="relative z-10 text-lg">Ver Información Personal Completa</span>
      </motion.button>
    </motion.div>
  )
}

interface QuickActionCardProps {
  icon: any
  title: string
  description: string
  onClick: () => void
}

function QuickActionCard({ icon: Icon, title, description, onClick }: QuickActionCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-emerald-100 text-emerald-700 p-3 rounded-lg inline-block mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </motion.div>
  )
}

interface ActivityItemProps {
  title: string
  description: string
  time: string
}

function ActivityItem({ title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full mt-0.5">
        <Clock className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  )
}

interface ScheduleItemProps {
  route: string
  date: string
  time: string
}

function ScheduleItem({ route, date, time }: ScheduleItemProps) {
  return (
    <div className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
      <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
        <Calendar className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{route}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-600">{date}</span>
          <Separator orientation="vertical" className="h-3" />
          <span className="text-sm text-gray-600">{time}</span>
        </div>
      </div>
    </div>
  )
}
