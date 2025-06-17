import type React from "react"
import { AlertTriangle, FileText, TrendingDown } from "lucide-react"

export const renderIcon = (iconName: string): React.ReactElement => {
  switch (iconName) {
    case "AlertTriangle":
      return <AlertTriangle className="w-4 h-4 text-orange-600" />
    case "FileText":
      return <FileText className="w-4 h-4 text-orange-600" />
    case "TrendingDown":
      return <TrendingDown className="w-4 h-4 text-orange-600" />
    default:
      return <FileText className="w-4 h-4 text-orange-600" />
  }
}
