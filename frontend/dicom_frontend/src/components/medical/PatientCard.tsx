"use client"

import type React from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import type {Patient} from "@/types/medical.types"
import {User, FileText} from "lucide-react"

interface PatientCardProps {
    patient: Patient,
    onClick?: () => void
}

export const PatientCard: React.FC<PatientCardProps> = ({patient, onClick}) => {
    return (
        <Card className="cursor-pointer hover:bg-gray-700 transition-colors border-gray-600 bg-gray-800"
              onClick={onClick}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400"/>
                        <span className="font-medium text-white">{patient.patientName}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {patient.modality}
                    </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">ID:</span>
                        <span>{patient.patientId}</span>
                    </div>

                    {patient.studyDescription && (
                        <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-gray-500"/>
                            <span className="truncate">{patient.studyDescription}</span>
                        </div>
                    )}

                    {patient.bodyPart && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">부위:</span>
                            <span>{patient.bodyPart}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
